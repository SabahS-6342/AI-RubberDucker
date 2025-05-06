from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from pymongo import MongoClient
from bson.objectid import ObjectId
import aiofiles
import os

app = FastAPI()

 
client = MongoClient("mongodb://localhost:27017")
db = client['material_db']
materials_col = db['materials']

 
app.add_middleware(SessionMiddleware, secret_key="sk_test_51RLlECC8q04ZNYrOYnulV5aicFxt27BPHMFaL6pS6nKOYPMoiQr7DWCDT3U8GkAxmkAUl1Zf0AAWISCVLGCbaxHg00gbDPY5d4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

 
ADMIN_TOKEN = "secret123"

 
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

 
config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    client_id="your_google_client_id",
    client_secret="your_google_client_secret",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = request.url_for("auth_google")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google")
async def auth_google(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Google login failed")
    request.session["user_email"] = user_info["email"]
    return {"message": "Logged in", "email": user_info["email"]}

 
@app.post("/materials/upload")
async def upload_material(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
):
    
    token = request.headers.get("x-admin-token")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    async with aiofiles.open(filepath, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

     
    new_material = {
        "title": title,
        "description": description,
        "filename": filename,
    }
    result = materials_col.insert_one(new_material)

    return {"message": "Material uploaded", "id": str(result.inserted_id)}

 
@app.get("/materials")
def list_materials():
    materials = materials_col.find()
    return [
        {"id": str(m["_id"]), "title": m["title"], "description": m["description"], "filename": m["filename"]}
        for m in materials
    ]

 
@app.get("/materials/download/{filename}")
def download_material(filename: str):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf", filename=filename)



