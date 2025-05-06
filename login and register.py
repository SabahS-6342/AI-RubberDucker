from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
import bcrypt

app = FastAPI(title="User Authentication API")

 
client = MongoClient("mongodb://localhost:27017")
db = client.chatbot_db
users_col = db.users

 
class AuthUser(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

     
    def validate_passwords(self):
        if self.password != self.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")

 
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

 
@app.post("/register")
async def register_user(request: RegisterRequest):
    request.validate_passwords()   

     
    if users_col.find_one({"email": request.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    if users_col.find_one({"username": request.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

 
    hashed_password = hash_password(request.password)

  
    users_col.insert_one({
        "username": request.username,
        "email": request.email,
        "password": hashed_password
    })
    
    return {"message": "User registered successfully"}

 
@app.post("/auth/login")
async def auth_login(user: AuthUser):
     
    existing_user = users_col.find_one({"username": user.username})
    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

     
    if not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful", "user_id": str(existing_user.get("_id"))}
