from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from pymongo import MongoClient
from authlib.integrations.starlette_client import OAuth
import torch
import os

app = FastAPI(title="DialoGPT Chatbot API")

 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

 
client = MongoClient("mongodb://localhost:27017")
db = client.chatbot_db
users_col = db.users
history_col = db.chat_history

 
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = await oauth.google.parse_id_token(request, token)
    users_col.update_one({"email": user['email']}, {"$set": user}, upsert=True)
    return RedirectResponse(url="/docs")

 
tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-medium")
model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-medium")

 
class ChatRequest(BaseModel):
    user_id: str
    message: str

class RegisterRequest(BaseModel):
    user_id: str
    name: str
    email: str

 
@app.post("/register")
async def register_user(request: RegisterRequest):
    existing = users_col.find_one({"user_id": request.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="User already registered")
    users_col.insert_one(request.dict())
    return {"message": "User registered successfully"}

 
@app.post("/chat")
async def chat(request: ChatRequest):
    user_id = request.user_id
    message = request.message

    user = users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not registered")

    
    record = history_col.find_one({"user_id": user_id})
    history_tensor = torch.tensor(record["history"]) if record else None

     
    input_ids = tokenizer.encode(message + tokenizer.eos_token, return_tensors='pt')
    bot_input_ids = torch.cat([history_tensor, input_ids], dim=-1) if history_tensor is not None else input_ids

    
    output_ids = model.generate(
        bot_input_ids,
        max_length=1000,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,
        top_k=50,
        top_p=0.95
    )

    
    history_col.update_one(
        {"user_id": user_id},
        {"$set": {"history": output_ids.tolist()}},
        upsert=True
    )

  
    response_text = tokenizer.decode(output_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)
    feedback = provide_code_feedback(message)

    return {"response": response_text, "code_feedback": feedback}

