from fastapi import FastAPI, Request, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, errors
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
import urllib.parse
import requests
import jwt
from datetime import datetime, timedelta, UTC
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import List, Optional, Dict, Any
from bson import ObjectId
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.utils import get_openapi
import time
from transformers import AutoModelForCausalLM, AutoTokenizer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError, PyJWTError
import logging
import PyPDF2
import io
import tempfile
import httpx
import json
import bcrypt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load and validate environment variables
load_dotenv()

required_env_vars = {
    'MONGODB_URL': 'MongoDB connection string',
    'GOOGLE_CLIENT_ID': 'Google OAuth client ID',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
    'GOOGLE_REDIRECT_URI': 'Google OAuth redirect URI',
    'GITHUB_CLIENT_ID': 'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET': 'GITHUB_CLIENT_SECRET',
    'JWT_SECRET_KEY': 'JWT secret key'
}

for var, desc in required_env_vars.items():
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var} ({desc})")

config = Config(".env")

# Create FastAPI app instance at module level
app = FastAPI(
    title="AI RubberDucker API",
    description="API for AI RubberDucker - A programming learning platform",
    version="1.0.0"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Session middleware for temporary storage
app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET_KEY"))

# MongoDB connection with error handling
try:
    client = MongoClient(os.getenv('MONGODB_URL'), serverSelectionTimeoutMS=5000)
    client.server_info()  # Test connection
except errors.ServerSelectionTimeoutError:
    raise Exception("Could not connect to MongoDB server")
except errors.ConnectionFailure:
    raise Exception("MongoDB connection failed")

db = client['airubberduckerdb']

# Collections
users_collection = db['users']
subscription_collection = db['subscription']
chatbot_interactions_collection = db['chatbot_interactions']
coding_exercises_collection = db['coding_exercises']
user_feedback_collection = db['user_feedback']
code_submissions_collection = db['code_submissions']
study_materials_collection = db['study_materials']
learning_paths_collection = db['learning_paths']
chat_sessions_collection = db['chat_sessions']

# Constants
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Add Hugging Face API configuration
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder"
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

# Initialize collections with indexes
def init_db():
    try:
        # Users collection
        users_collection.create_index([("email", 1)], unique=True)
        users_collection.create_index([("username", 1)], unique=True)
        users_collection.create_index([("status", 1)])
        
        # Subscription collection
        subscription_collection.create_index([("user_id", 1)])
        subscription_collection.create_index([("plantype", 1)])
        
        # Chatbot Interactions collection
        chatbot_interactions_collection.create_index([("user_id", 1)])
        chatbot_interactions_collection.create_index([("timestamp", 1)])
        
        # Coding Exercises collection
        coding_exercises_collection.create_index([("material_category", 1)])
        coding_exercises_collection.create_index([("difficulty_level", 1)])
        
        # User Feedback collection
        user_feedback_collection.create_index([("user_id", 1)])
        user_feedback_collection.create_index([("feedback_timestamp", 1)])
        
        # Code Submissions collection
        code_submissions_collection.create_index([("user_id", 1)])
        code_submissions_collection.create_index([("exercise_id", 1)])
        code_submissions_collection.create_index([("submission_date", 1)])
        
        # Study Materials collection
        study_materials_collection.create_index([("category", 1)])
        study_materials_collection.create_index([("difficulty_level", 1)])
        study_materials_collection.create_index([("content_type", 1)])
        
        # Learning Paths collection
        learning_paths_collection.create_index([("title", 1)], unique=True)
        learning_paths_collection.create_index([("difficulty_level", 1)])

        # Chat sessions collection
        chat_sessions_collection.create_index([("user_id", 1)])
        chat_sessions_collection.create_index([("created_at", 1)])
    except errors.OperationFailure as e:
        raise Exception(f"Failed to create indexes: {str(e)}")

init_db()

# Models with validation
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    verified: bool = False
    subscription_id: Optional[str] = None
    interactioncount: int = 0
    maxdailyinteractions: int = 3
    preferences: str = "light-mode,beginner-python"
    progress: str = "0%"
    role: str = "user"
    status: str = "active"

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ["user", "admin"]:
            raise ValueError("Role must be either 'user' or 'admin'")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ["active", "inactive"]:
            raise ValueError("Status must be either 'active' or 'inactive'")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        validate_password(v)
        return v

class User(UserBase):
    id: str
    password: str
    created_at: datetime

    class Config:
        from_attributes = True

class Subscription(BaseModel):
    id: str
    user_id: str
    plantype: str = Field(..., pattern=r"^(Free|Basic|Premium)$")
    price: float = Field(..., ge=0)
    dailylimit: int = Field(..., gt=0)
    start_date: datetime
    is_active: bool = True

class ChatbotInteraction(BaseModel):
    id: str
    user_id: str
    timestamp: datetime
    question: str
    topic: str
    bot_response: str
    is_followup: bool = False

class CodingExercise(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    difficulty: str = Field(..., pattern="^(Easy|Medium|Hard|Custom)$")
    category: str = Field(..., min_length=1, max_length=50)
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserFeedback(BaseModel):
    id: str
    user_id: str
    message: str = Field(..., min_length=1, max_length=1000)
    feedback_timestamp: datetime

class CodeSubmission(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    exercise_id: Optional[str] = None
    code: str = Field(..., min_length=1)
    language: str = Field(..., pattern=r"^(python|javascript|java|c\+\+|c|go|rust|ruby|php|swift|kotlin|typescript)$")
    test_input: str = Field(..., min_length=1)
    expected_output: str = Field(..., min_length=1)
    submission_date: Optional[datetime] = None
    status: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

class StudyMaterial(BaseModel):
    id: str
    title: str
    description: str
    type: str = Field(..., pattern=r"^(article|video|book)$")
    difficulty: str = Field(..., pattern=r"^(Beginner|Intermediate|Advanced)$")
    url: str
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('content_url', 'content_text')
    @classmethod
    def validate_content(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Content cannot be empty if provided")
        return v

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60

class TokenData(BaseModel):
    email: Optional[str] = None

class LearningPath(BaseModel):
    id: str
    title: str
    description: str
    difficulty_level: str = Field(..., pattern=r"^(Beginner|Intermediate|Advanced)$")
    estimated_duration: str
    topics: List[str]
    created_at: datetime
    updated_at: datetime

# Add new models for chat sessions
class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    last_updated: datetime
    messages: List[Dict[str, str]]
    topic: Optional[str] = None
    difficulty_level: Optional[str] = None

# Chatbot models
class ChatRequest(BaseModel):
    message: str
    topic: Optional[str] = None
    difficulty_level: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    history: List[Dict[str, str]]
    title: Optional[str] = None

# Add new model for PDF summary
class PDFSummary(BaseModel):
    filename: str
    summary: str
    key_points: List[str]

# Helper functions with error handling
def validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        raise ValueError("Password must contain at least one special character")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password verification failed: {str(e)}"
        )

def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password hashing failed: {str(e)}"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(UTC) + expires_delta
        else:
            expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token creation failed: {str(e)}"
        )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (InvalidTokenError, PyJWTError):
        raise credentials_exception
    
    try:
        user = users_collection.find_one({"email": token_data.email})
        if user is None:
            raise credentials_exception
        user["id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self, times: int, minutes: int):
        self.times = times
        self.minutes = minutes
        self.requests = {}

    async def check(self, key: str):
        current_time = time.time()
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests
        self.requests[key] = [t for t in self.requests[key] if current_time - t < self.minutes * 60]
        
        if len(self.requests[key]) >= self.times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests"
            )
        
        self.requests[key].append(current_time)

# Initialize rate limiters
admin_users_limiter = RateLimiter(times=10, minutes=1)
admin_stats_limiter = RateLimiter(times=20, minutes=1)
admin_status_limiter = RateLimiter(times=5, minutes=1)

# Admin routes with error handling
@app.get("/api/admin/users", response_model=List[User])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    await admin_users_limiter.check("admin_users")
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    try:
        users = list(users_collection.find())
        for user in users:
            user["id"] = str(user["_id"])
        return users
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    await admin_stats_limiter.check("admin_stats")
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    try:
        total_users = users_collection.count_documents({})
        
        active_sessions = chatbot_interactions_collection.count_documents({
            "timestamp": {
                "$gte": datetime.now(UTC) - timedelta(minutes=30)
            }
        })
        
        code_submissions = code_submissions_collection.count_documents({})
        
        return {
            "total_users": total_users,
            "active_sessions": active_sessions,
            "code_submissions": code_submissions
        }
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )

@app.put("/api/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    await admin_status_limiter.check("admin_status")
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    if status not in ["active", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be either 'active' or 'inactive'"
        )
    
    try:
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": f"User {user_id} status updated to {status}"}
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )

# Routes
@app.get("/auth/github")
async def auth_github():
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "scope": "user:email",
        "redirect_uri": f"{FRONTEND_URL}/auth/callback"  # Frontend callback URL
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)

@app.get("/auth/github/callback")
async def github_callback(code: str):
    try:
        # Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": f"{FRONTEND_URL}/auth/callback"  # Frontend callback URL
        }
        headers = {"Accept": "application/json"}
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data, headers=headers)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="Failed to get access token from GitHub")
            
            # Get user info from GitHub
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_response.raise_for_status()
            github_user = user_response.json()
            
            # Get user's email if not public
            if not github_user.get("email"):
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                email_response.raise_for_status()
                emails = email_response.json()
                primary_email = next((email["email"] for email in emails if email["primary"]), None)
                if primary_email:
                    github_user["email"] = primary_email
            
            # Create or update user in database
            user_data = {
                "username": github_user["login"],
                "email": github_user["email"],
                "full_name": github_user.get("name", ""),
                "avatar_url": github_user.get("avatar_url", ""),
                "github_id": str(github_user["id"]),
                "is_active": True
            }
            
            # Ensure username is unique
            base_username = user_data["username"]
            username = base_username
            counter = 1
            while await users_collection.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
            user_data["username"] = username
            
            # Update or insert user
            result = await users_collection.update_one(
                {"email": user_data["email"]},
                {"$set": user_data},
                upsert=True
            )
            
            # Get the user document
            user = await users_collection.find_one({"email": user_data["email"]})
            
            # Generate tokens
            access_token = create_access_token(data={"sub": str(user["_id"])})
            refresh_token = create_access_token(data={"sub": str(user["_id"]), "type": "refresh"}, expires_delta=timedelta(days=30))
            
            # Prepare user data for frontend
            user_data_for_frontend = {
                "username": user["username"],
                "email": user["email"],
                "full_name": user.get("full_name", ""),
                "avatar_url": user.get("avatar_url", "")
            }
            
            # Redirect to frontend with tokens and user data
            return RedirectResponse(
                url=f"{FRONTEND_URL}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&user={json.dumps(user_data_for_frontend)}"
            )
            
    except Exception as e:
        print(f"GitHub callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/google")
async def auth_google():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)

@app.get("/auth/google/callback")
async def auth_google_callback(
    request: Request,
    code: str = None,
    error: str = None,
    error_description: str = None
):
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error_description or error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code"
        )
    
    try:
        # Exchange code for tokens
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post("https://oauth2.googleapis.com/token", data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # Get user info
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            # Create or update user in database
            user_data = {
                "username": user_info.get("name", "") or user_info["email"].split("@")[0],
                "email": user_info["email"],
                "full_name": user_info.get("name", ""),
                "avatar_url": user_info.get("picture", ""),
                "google_id": user_info["id"],
                "is_active": True
            }
            
            # Ensure username is unique
            base_username = user_data["username"]
            username = base_username
            counter = 1
            while await users_collection.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
            user_data["username"] = username
            
            # Update or insert user
            result = await users_collection.update_one(
                {"email": user_data["email"]},
                {"$set": user_data},
                upsert=True
            )
            
            # Get the user document
            user = await users_collection.find_one({"email": user_data["email"]})
            
            # Generate tokens
            access_token = create_access_token(data={"sub": str(user["_id"])})
            refresh_token = create_access_token(
                data={"sub": str(user["_id"]), "type": "refresh"},
                expires_delta=timedelta(days=30)
            )
            
            # Prepare user data for frontend
            user_data_for_frontend = {
                "username": user["username"],
                "email": user["email"],
                "full_name": user.get("full_name", ""),
                "avatar_url": user.get("avatar_url", "")
            }
            
            # Redirect to frontend with tokens and user data
            return RedirectResponse(
                url=f"{FRONTEND_URL}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&user={json.dumps(user_data_for_frontend)}"
            )
            
    except Exception as e:
        print(f"Google callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Update the email login endpoint to match the same pattern
@app.post("/api/auth/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        # Find user by email
        user = users_collection.find_one({"email": form_data.username})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(user["_id"])})
        refresh_token = create_access_token(
            data={"sub": str(user["_id"]), "type": "refresh"},
            expires_delta=timedelta(days=30)
        )
        
        # Prepare user data for frontend
        user_data_for_frontend = {
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "avatar_url": user.get("avatar_url", "")
        }
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_data_for_frontend
        }
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

# Token refresh endpoint
@app.post("/api/auth/refresh")
async def refresh_token(
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user)
):
    try:
        # Create new access token
        access_token = create_access_token(
            data={"sub": current_user["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@app.post("/api/auth/google")
async def verify_google_token(token: str):
    try:
        # Verify the token with Google
        token_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": token}
        )
        token_response.raise_for_status()
        token_info = token_response.json()
        
        # Get user info
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_info_response.raise_for_status()
        user_info = user_info_response.json()
        
        # Create or update user
        # Ensure username is unique
        base_username = user_info.get("name", "") or user_info["email"].split("@")[0]
        username = base_username
        i = 1
        while users_collection.find_one({"username": username, "email": {"$ne": user_info["email"]}}):
            username = f"{base_username}{i}"
            i += 1
        user_data = {
            "email": user_info["email"],
            "username": username,
            "verified": True,
            "created_at": datetime.now(UTC)
        }
        result = users_collection.update_one(
            {"email": user_info["email"]},
            {"$set": user_data},
            upsert=True
        )
        
        # Generate JWT tokens
        access_token = create_access_token({"sub": user_info["email"]})
        
        return {
            "token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user_info["email"],
                "username": user_info.get("name", ""),
                "verified": True
            }
        }
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to verify Google token: {str(e)}"
        )
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# Add a new function to handle optional authentication
async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = TokenData(email=email)
    except (ExpiredSignatureError, InvalidTokenError, PyJWTError):
        return None
    
    try:
        user = users_collection.find_one({"email": token_data.email})
        if user is None:
            return None
        user["id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    except errors.PyMongoError:
        return None

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        user_id = str(current_user["_id"])
        
        try:
            # Sessions count for this user
            sessions_count = chatbot_interactions_collection.count_documents({"user_id": user_id})
            
            # Topics explored by this user
            topics = chatbot_interactions_collection.distinct("topic", {"user_id": user_id})
            topics_count = len(topics)
            
            # Progress (example: % of completed exercises)
            total_exercises = coding_exercises_collection.count_documents({})
            completed_exercises = code_submissions_collection.count_documents(
                {"user_id": user_id, "status": "completed"}
            )
            progress_percentage = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
            
            return {
                "sessions": {
                    "count": sessions_count,
                    "increase": "10%"  # This could be calculated based on previous period
                },
                "topics": {
                    "count": topics_count,
                    "new_this_week": len([t for t in topics if t])  # Count non-empty topics
                },
                "progress": {
                    "percentage": f"{progress_percentage:.1f}%",
                    "increase": "5%"  # This could be calculated based on previous period
                }
            }
            
        except errors.PyMongoError as e:
            print(f"MongoDB error in user dashboard: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in user dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        user_id = str(current_user["_id"])
        
        try:
            # Get recent chatbot interactions
            recent_chatbot = list(chatbot_interactions_collection.find(
                {"user_id": user_id},
                {"_id": 0, "question": 1, "timestamp": 1}
            ).sort("timestamp", -1).limit(3))
            
            # Get recent code submissions
            recent_submissions = list(code_submissions_collection.find(
                {"user_id": user_id},
                {"_id": 0, "exercise_id": 1, "status": 1, "submission_date": 1}
            ).sort("submission_date", -1).limit(2))
            
            # Combine and format activities
            recent_activity = [
                {"title": f"Chatbot: {c.get('question', '')[:50]}", "status": "completed"} 
                for c in recent_chatbot
            ] + [
                {"title": f"Code Submission: {s.get('exercise_id', '')}", "status": s.get("status", "unknown")} 
                for s in recent_submissions
            ]
            
            # Sort by timestamp (most recent first)
            recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return recent_activity
            
        except errors.PyMongoError as e:
            print(f"MongoDB error in recent activity: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in recent activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.get("/api/learning-paths")
async def get_learning_paths(current_user: dict = Depends(get_current_user)):
    try:
        learning_paths = list(learning_paths_collection.find())
        for path in learning_paths:
            path["id"] = str(path["_id"])
        return learning_paths
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch learning paths: {str(e)}"
        )

@app.get("/api/learning-paths/{path_id}")
async def get_learning_path(path_id: str, current_user: dict = Depends(get_current_user)):
    try:
        path = learning_paths_collection.find_one({"_id": ObjectId(path_id)})
        if not path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning path not found"
            )
        path["id"] = str(path["_id"])
        return path
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch learning path: {str(e)}"
        )

@app.get("/api/study-materials")
async def get_study_materials(current_user: dict = Depends(get_current_user)):
    try:
        study_materials = list(study_materials_collection.find())
        for material in study_materials:
            material["id"] = str(material["_id"])
        return study_materials
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch study materials: {str(e)}"
        )

@app.get("/api/study-materials/{material_id}")
async def get_study_material(material_id: str, current_user: dict = Depends(get_current_user)):
    try:
        material = study_materials_collection.find_one({"_id": ObjectId(material_id)})
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study material not found"
            )
        material["id"] = str(material["_id"])
        return material
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch study material: {str(e)}"
        )

# Chatbot configuration
MODEL_NAME = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

def generate_text(
    prompt: str,
    max_new_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
    repetition_penalty: float = 1.2,
    do_sample: bool = True
) -> str:
    """Generate text using the GPT-2 model."""
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            do_sample=do_sample,
            pad_token_id=tokenizer.eos_token_id
        )
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as e:
        print(f"Error in generate_text: {str(e)}")
        return ""

def generate_conversation_title(chat_history: List[Dict], current_topic: str = None) -> str:
    """Generate a title for the conversation based on context."""
    if not chat_history:
        return "New Conversation"
    
    # Try to extract topic from recent messages
    recent_messages = chat_history[-5:]  # Look at last 5 messages
    topic_keywords = {
        "operating system": "OS",
        "system call": "System Calls",
        "process": "Process Management",
        "memory": "Memory Management",
        "file": "File Systems",
        "driver": "Device Drivers",
        "algorithm": "Algorithms",
        "data structure": "Data Structures",
        "programming": "Programming",
        "web": "Web Development",
        "python": "Python",
        "java": "Java",
        "javascript": "JavaScript"
    }
    
    # First check current topic if provided
    if current_topic:
        for keyword, title in topic_keywords.items():
            if keyword in current_topic.lower():
                return f"Learning {title}"
    
    # Then check recent messages
    for message in reversed(recent_messages):
        if message["role"] == "user":
            user_input = message["content"].lower()
            for keyword, title in topic_keywords.items():
                if keyword in user_input:
                    return f"Learning {title}"
    
    # If no specific topic found, generate a generic title
    return "Programming Learning Session"

def generate_response(user_input: str, chat_history: List[Dict] = None) -> str:
    """Generate a response using GPT-2 model with conversation context."""
    try:
        # Format the conversation history for context
        context = ""
        if chat_history:
            print(f"Debug - Chat history type: {type(chat_history)}")
            print(f"Debug - Chat history: {chat_history}")
            
            # Get the last 3 exchanges for context
            recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history
            for msg in recent_history:
                print(f"Debug - Message type: {type(msg)}")
                print(f"Debug - Message content: {msg}")
                
                if isinstance(msg, dict):
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    if role and content:
                        role_display = "Student" if role == "user" else "Tutor"
                        context += f"{role_display}: {content}\n"
                elif isinstance(msg, str):
                    # Handle case where message might be a string
                    context += f"Message: {msg}\n"
        
        # Create a more natural prompt
        prompt = f"""You are a friendly and knowledgeable programming tutor having a natural conversation with a student.

Previous conversation:
{context}

Student: {user_input}

Tutor: Let me help you with that. """

        print(f"Debug - Generated prompt: {prompt}")

        # Generate response with more creative parameters
        response = generate_text(
            prompt,
            max_new_tokens=150,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            do_sample=True
        )

        # Clean up the response
        response = response.strip()
        
        # Remove the prompt if it appears in the response
        if prompt in response:
            response = response[len(prompt):].strip()
        
        # If response is too short or empty, try again with different parameters
        if len(response) < 20:
            response = generate_text(
                prompt,
                max_new_tokens=200,
                temperature=0.8,
                top_p=0.95,
                repetition_penalty=1.3,
                do_sample=True
            ).strip()
            
            if prompt in response:
                response = response[len(prompt):].strip()
        
        # If still no good response, provide a fallback
        if len(response) < 20:
            response = "I understand you're interested in programming. Could you please rephrase your question or let me know what specific topic you'd like to learn about?"

        return response

    except Exception as e:
        print(f"Error generating response: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return "I apologize, but I'm having trouble generating a response right now. Could you please try asking your question again?"

@app.get("/user/dashboard")
async def get_user_dashboard(current_user: dict = Depends(get_current_user)):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        user_id = str(current_user["_id"])
        
        try:
            # Sessions count for this user
            sessions_count = chatbot_interactions_collection.count_documents({"user_id": user_id})
            
            # Topics explored by this user
            topics = chatbot_interactions_collection.distinct("topic", {"user_id": user_id})
            topics_count = len(topics)
            
            # Progress (example: % of completed exercises)
            total_exercises = coding_exercises_collection.count_documents({})
            completed_exercises = code_submissions_collection.count_documents(
                {"user_id": user_id, "status": "completed"}
            )
            progress_percentage = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
            
            # Recent activity
            recent_chatbot = list(chatbot_interactions_collection.find(
                {"user_id": user_id},
                {"_id": 0, "question": 1, "timestamp": 1}
            ).sort("timestamp", -1).limit(3))
            
            recent_submissions = list(code_submissions_collection.find(
                {"user_id": user_id},
                {"_id": 0, "exercise_id": 1, "status": 1, "submission_date": 1}
            ).sort("submission_date", -1).limit(2))
            
            recent_activity = [
                {"title": f"Chatbot: {c.get('question', '')[:50]}", "status": "completed"} 
                for c in recent_chatbot
            ] + [
                {"title": f"Code Submission: {s.get('exercise_id', '')}", "status": s.get("status", "unknown")} 
                for s in recent_submissions
            ]
            
            return {
                "sessions": sessions_count,
                "topics": topics_count,
                "progress": f"{progress_percentage:.1f}%",
                "recent_activity": recent_activity
            }
            
        except errors.PyMongoError as e:
            print(f"MongoDB error in user dashboard: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in user dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

# Add new endpoints for session management
@app.post("/api/chat/sessions", response_model=ChatSession)
async def create_chat_session(
    request: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        # Generate session title
        title = generate_session_title(request.message)
        
        # Create new session
        session = {
            "user_id": str(current_user["_id"]),
            "title": title,
            "created_at": datetime.now(UTC),
            "last_updated": datetime.now(UTC),
            "messages": [{
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now(UTC)
            }],
            "topic": request.topic,
            "difficulty_level": request.difficulty_level
        }
        
        result = chat_sessions_collection.insert_one(session)
        session["id"] = str(result.inserted_id)
        
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}"
        )

@app.get("/api/chat/sessions", response_model=List[ChatSession])
async def get_chat_sessions(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        sessions = list(chat_sessions_collection.find(
            {"user_id": str(current_user["_id"])}
        ).sort("last_updated", -1))
        
        for session in sessions:
            session["id"] = str(session["_id"])
        
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat sessions: {str(e)}"
        )

@app.get("/api/chat/sessions/{session_id}", response_model=ChatSession)
async def get_chat_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        session = chat_sessions_collection.find_one({
            "_id": ObjectId(session_id),
            "user_id": str(current_user["_id"])
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        session["id"] = str(session["_id"])
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat session: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
async def chat_direct(
    message: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        # Clean and validate the input message
        if not message.message or not message.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )

        # Check if the message is a greeting or non-programming related
        message_lower = message.message.lower()
        
        # Handle PDF-related questions
        if "pdf" in message_lower or "document" in message_lower or "upload" in message_lower:
            response = """I can help you summarize PDF documents! Here's how to use this feature:

1. Click the "Upload PDF" button in the chat interface
2. Select your PDF file
3. I'll analyze the document and provide:
   - A concise summary
   - Key points extracted from the content
   - Main topics discussed

Would you like to:
1. Upload a PDF now?
2. Learn more about the summarization feature?
3. See an example of how the summary will look?

Just let me know what you'd like to do!"""

        # Handle greetings
        elif any(greeting in message_lower for greeting in ["hi", "hello", "hey", "hy", "wtf"]):
            response = "Hello! I'm your AI programming tutor. I'm here to help you learn about programming. What would you like to learn about today? I can help with topics like Python, JavaScript, algorithms, or any other programming concepts."
        
        # Handle OOP topics
        elif any(term in message_lower for term in ["oop", "object oriented", "object-oriented", "classes", "objects"]):
            response = """Let me explain Object-Oriented Programming (OOP)!

OOP is a programming paradigm that uses objects to organize code. Here are the key concepts:

1. Classes and Objects:
```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def bark(self):
        return f"{self.name} says: Woof!"

# Creating an object
my_dog = Dog("Buddy", 3)
print(my_dog.bark())  # Output: Buddy says: Woof!
```

2. The Four Pillars of OOP:
   - Encapsulation: Bundling data and methods
   - Inheritance: Creating new classes from existing ones
   - Polymorphism: Using a single interface for different types
   - Abstraction: Hiding complex implementation details

Would you like to learn more about:
1. Classes and Objects in detail?
2. Any of the four pillars of OOP?
3. OOP in a specific language (Python, Java, JavaScript)?
4. Real-world examples of OOP?

Let me know which aspect you'd like to explore first!"""

        # Handle long, off-topic messages
        elif len(message.message.split()) > 20:
            response = "I notice your message is quite detailed. I'm specifically designed to help with programming topics. Could you please let me know what programming concept or language you'd like to learn about? I'm here to help make programming easier to understand!"
        
        else:
            # Generate response with better context
            prompt = f"""You are a helpful programming tutor. The student has sent you a message: "{message.message}"

Please provide a clear, focused response about programming concepts. If the message is unclear or not related to programming, politely ask for clarification about what programming topic they'd like to learn about."""

            response = generate_text(
                prompt,
                max_new_tokens=150,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.2,
                do_sample=True
            )

            # Clean up the response
            response = response.strip()
            
            # Remove any prompt-like text that might have leaked into the response
            response = response.replace(prompt, "").strip()
            
            # If response is too short or empty, provide a default response
            if not response or len(response) < 20:
                response = "I'd be happy to help you learn about programming! Could you please let me know what specific programming topic or concept you'd like to learn about? For example, you could ask about Python, JavaScript, algorithms, data structures, or any other programming topic."

        # Create message objects
        user_message = {
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now(UTC).isoformat()
        }
        ai_message = {
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(UTC).isoformat()
        }

        # Store the interaction
        interaction = {
            "user_id": str(current_user["_id"]),
            "question": message.message,
            "bot_response": response,
            "timestamp": datetime.now(UTC),
            "topic": message.topic or "general",
            "is_followup": False
        }
        chatbot_interactions_collection.insert_one(interaction)
        
        return {
            "response": response,
            "history": [user_message, ai_message],
            "title": generate_conversation_title([user_message, ai_message], message.topic)
        }
    except Exception as e:
        print(f"Error in direct chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )

@app.post("/api/chat/{session_id}", response_model=ChatResponse)
async def chat_with_session(
    session_id: str,
    message: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        # Get the session
        session = chat_sessions_collection.find_one({
            "_id": ObjectId(session_id),
            "user_id": str(current_user["_id"])
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify user has access to this session
        if session["user_id"] != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this session"
            )
        
        # Generate response
        response = generate_response(
            message.message,
            session.get("messages", [])
        )

        # Create message objects
        user_message = {
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now(UTC).isoformat()
        }
        ai_message = {
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(UTC).isoformat()
        }

        # Update session with new messages
        chat_sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "messages": {"$each": [user_message, ai_message]}
                },
                "$set": {
                    "last_updated": datetime.now(UTC)
                }
            }
            )

        return {
            "response": response,
            "history": session.get("messages", []) + [user_message, ai_message],
            "title": session.get("title", "Chat Session")
        }
    except Exception as e:
        print(f"Error in session chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )

def generate_session_title(user_input: str, chat_history: List[str] = None) -> str:
    """Generate a title for the chat session based on the first message and context."""
    try:
        # Create a prompt for title generation
        prompt = f"""Generate a short, descriptive title for a programming learning session.
First message: {user_input}
Context: {chat_history[-2] if chat_history else 'New session'}

Title should be 3-5 words and reflect the main topic."""

        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        output = model.generate(
            **inputs,
            max_new_tokens=20,
            pad_token_id=tokenizer.eos_token_id,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True
        )
        title = tokenizer.decode(output[0], skip_special_tokens=True).strip()
        
        # Clean up the title
        title = title.replace("Title:", "").strip()
        if not title or len(title.split()) > 5:
            # Fallback title based on input
            words = user_input.lower().split()
            if len(words) > 3:
                title = " ".join(words[:3]).title()
            else:
                title = user_input.title()
        
        return f"Learning {title}"
    except Exception as e:
        print(f"Error generating session title: {str(e)}")
        return f"Learning Session {datetime.now(UTC).strftime('%Y-%m-%d %H:%M')}"

# Add new endpoint for PDF upload and summarization
@app.post("/api/chat/pdf-summary", response_model=PDFSummary)
async def summarize_pdf(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )

        # Read the PDF file
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()

        # Generate summary using GPT-2
        prompt = f"""Please summarize the following text and extract key points:

{text[:1000]}  # First 1000 characters for context

Please provide:
1. A brief summary
2. Key points as a bullet list"""

        summary = generate_text(
            prompt,
            max_new_tokens=300,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            do_sample=True
        )

        # Split summary into main summary and key points
        parts = summary.split('\n\n')
        main_summary = parts[0] if parts else summary
        key_points = [point.strip('- ') for point in parts[1].split('\n') if point.strip()] if len(parts) > 1 else []

        # Store the interaction
        interaction = {
            "user_id": str(current_user["_id"]),
            "question": f"PDF Summary Request: {file.filename}",
            "bot_response": summary,
            "timestamp": datetime.now(UTC),
            "topic": "pdf_summary",
            "is_followup": False
        }
        chatbot_interactions_collection.insert_one(interaction)

        return PDFSummary(
            filename=file.filename,
            summary=main_summary,
            key_points=key_points
        )

    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {str(e)}"
        )

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        # Remove sensitive information
        user_data = current_user.copy()
        user_data.pop("password", None)
        user_data.pop("_id", None)
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )

@app.put("/api/user/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Remove sensitive fields that shouldn't be updated
        update_data = {k: v for k, v in profile_data.items() if k not in [
            "password", "_id", "email", "role", "status", "created_at"
        ]}
        
        # Update user in database
        result = users_collection.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made to the profile"
            )
        
        # Get updated user data
        updated_user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
        updated_user["id"] = str(updated_user["_id"])
        updated_user.pop("password", None)
        updated_user.pop("_id", None)
        
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}"
        )

# Add new authentication models
class AuthUser(BaseModel):
    email: EmailStr
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


@app.post("/api/auth/register")
async def register_user(request: RegisterRequest):
    try:
        request.validate_passwords()

        # Check if email or username already exists
        if users_collection.find_one({"email": request.email}):
            raise HTTPException(status_code=400, detail="Email already exists")
        if users_collection.find_one({"username": request.username}):
            raise HTTPException(status_code=400, detail="Username already exists")

        # Hash password
        hashed_password = hash_password(request.password)

        # Create user document
        user_data = {
            "username": request.username,
            "email": request.email,
            "password": hashed_password,
            "verified": False,
            "subscription_id": None,
            "interactioncount": 0,
            "maxdailyinteractions": 3,
            "preferences": "light-mode,beginner-python",
            "progress": "0%",
            "role": "user",
            "status": "active",
            "created_at": datetime.now(UTC)
        }

        # Insert user into database
        result = users_collection.insert_one(user_data)
        
        # Get the created user
        user = users_collection.find_one({"_id": result.inserted_id})
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(user["_id"])})
        refresh_token = create_access_token(
            data={"sub": str(user["_id"]), "type": "refresh"},
            expires_delta=timedelta(days=30)
        )

        # Prepare user data for frontend
        user_data_for_frontend = {
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "avatar_url": user.get("avatar_url", "")
        }

        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_data_for_frontend
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

# Add new email-based login endpoint
@app.post("/api/auth/email-login")
async def email_login(user: AuthUser):
    try:
        # Find user by email
        existing_user = users_collection.find_one({"email": user.email})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Verify password
        if not verify_password(user.password, existing_user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Generate tokens
        access_token = create_access_token(data={"sub": str(existing_user["_id"])})
        refresh_token = create_access_token(
            data={"sub": str(existing_user["_id"]), "type": "refresh"},
            expires_delta=timedelta(days=30)
        )

        # Prepare user data for frontend
        user_data_for_frontend = {
            "username": existing_user["username"],
            "email": existing_user["email"],
            "full_name": existing_user.get("full_name", ""),
            "avatar_url": existing_user.get("avatar_url", "")
        }

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_data_for_frontend
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

# Add coding exercise endpoints
@app.post("/api/coding-exercises", response_model=CodingExercise)
async def save_coding_exercise(
    exercise: CodingExercise,
    current_user: dict = Depends(get_current_user)
):
    try:
        exercise_data = exercise.model_dump()
        exercise_data["user_id"] = str(current_user["_id"])
        exercise_data["created_at"] = datetime.now(UTC)
        exercise_data["updated_at"] = datetime.now(UTC)
        
        result = coding_exercises_collection.insert_one(exercise_data)
        exercise_data["id"] = str(result.inserted_id)
        
        return exercise_data
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save coding exercise: {str(e)}"
        )

@app.get("/api/coding-exercises", response_model=List[CodingExercise])
async def get_coding_exercises(current_user: dict = Depends(get_current_user)):
    try:
        exercises = list(coding_exercises_collection.find({"user_id": str(current_user["_id"])}))
        for exercise in exercises:
            exercise["id"] = str(exercise["_id"])
        return exercises
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch coding exercises: {str(e)}"
        )

@app.post("/api/coding-exercises/upload")
async def upload_coding_exercise_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Read file content
        content = await file.read()
        
        # Handle different file types
        if file.content_type == "application/pdf":
            # Convert PDF to text
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text()
        else:
            # Assume text file
            text_content = content.decode('utf-8')
        
        # Create exercise document
        exercise_data = {
            "title": file.filename.split('.')[0],
            "content": text_content,
            "difficulty": "Custom",
            "category": "Uploaded",
            "user_id": str(current_user["_id"]),
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC)
        }
        
        result = coding_exercises_collection.insert_one(exercise_data)
        exercise_data["id"] = str(result.inserted_id)
        
        return exercise_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )

# Judge0 API Configuration
JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"
JUDGE0_HEADERS = {
    "X-RapidAPI-Key": os.getenv("RAPIDAPI_KEY"),
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    "Content-Type": "application/json"
}

# Language ID mapping for Judge0
LANGUAGE_IDS = {
    "python": 71,  # Python 3.8.1
    "javascript": 63,  # JavaScript (Node.js 12.14.0)
    "java": 62,  # Java (OpenJDK 13.0.1)
    "c++": 54,  # C++ (GCC 9.2.0)
    "c": 50,  # C (GCC 9.2.0)
    "go": 60,  # Go (1.13.5)
    "rust": 73,  # Rust (1.40.0)
    "ruby": 72,  # Ruby (2.7.0)
    "php": 68,  # PHP (7.4.1)
    "swift": 83,  # Swift (5.2.3)
    "kotlin": 78,  # Kotlin (1.3.70)
    "typescript": 74,  # TypeScript (3.7.4)
}

@app.post("/api/code/submit", response_model=dict)
async def submit_code(
    payload: CodeSubmission,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Log the incoming payload
        print("Received code submission:", payload.model_dump())
        
        # Get language ID
        language_id = LANGUAGE_IDS.get(payload.language.lower())
        if not language_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language: {payload.language}"
            )

        # Prepare Judge0 payload
        judge0_payload = {
            "source_code": payload.code,
            "language_id": language_id,
            "stdin": payload.test_input or ""
        }
        print("Sending payload to Judge0:", judge0_payload)

        # Make the request to Judge0 API
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                print("Making request to Judge0 API...")
                response = await client.post(
                    JUDGE0_URL,
                    json=judge0_payload,
                    headers=JUDGE0_HEADERS
                )
                print("Received response from Judge0:", response.status_code)
                response.raise_for_status()
                judge0_result = response.json()
                print("Judge0 API response:", judge0_result)

                # Process the result
                output = judge0_result.get("stdout", "")
                stderr = judge0_result.get("stderr", "")
                compile_output = judge0_result.get("compile_output", "")
                status_id = judge0_result.get("status", {}).get("id", 0)

                # Check for compilation errors
                if status_id == 3:  # Compilation Error
                    error_message = compile_output or stderr or "Compilation error"
                    print("Compilation error:", error_message)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_message
                    )

                # Check for runtime errors
                if status_id == 6:  # Runtime Error
                    error_message = stderr or "Runtime error"
                    print("Runtime error:", error_message)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_message
                    )

                # Check if the output matches expected output
                passed = output.strip() == payload.expected_output.strip()

                # Create submission record
                submission_data = {
                    "user_id": str(current_user["_id"]),
                    "exercise_id": payload.exercise_id,
                    "code": payload.code,
                    "language": payload.language,
                    "test_input": payload.test_input,
                    "expected_output": payload.expected_output,
                    "actual_output": output,
                    "submission_date": datetime.now(UTC),
                    "status": "success" if passed else "failed",
                    "score": 100 if passed else 0,
                    "error": stderr or compile_output
                }

                # Save to database
                try:
                    result = code_submissions_collection.insert_one(submission_data)
                    submission_data["id"] = str(result.inserted_id)
                    print("Saved submission to database:", submission_data["id"])
                except Exception as e:
                    print(f"Database error: {e}")
                    # Continue even if database save fails

                # Return the complete response
                return {
                    "passed": passed,
                    "output": output,
                    "expected": payload.expected_output,
                    "stderr": stderr,
                    "compile_output": compile_output,
                    "submission_id": submission_data.get("id"),
                    "status": judge0_result.get("status", {}),
                    "time": judge0_result.get("time"),
                    "memory": judge0_result.get("memory")
                }

            except httpx.TimeoutException:
                print("Judge0 API request timed out")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Code execution service timed out"
                )
            except httpx.HTTPStatusError as e:
                print(f"Judge0 API error: {e}")
                print(f"Response content: {e.response.content if e.response else 'No response content'}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Code execution service error: {str(e)}"
                )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in code submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process code submission: {str(e)}"
        )

# Add endpoint to get submission history
@app.get("/api/code/submissions", response_model=List[CodeSubmission])
async def get_code_submissions(
    current_user: dict = Depends(get_current_user),
    exercise_id: Optional[str] = None
):
    try:
        query = {"user_id": str(current_user["_id"])}
        if exercise_id:
            query["exercise_id"] = exercise_id

        submissions = list(code_submissions_collection.find(query).sort("submission_date", -1))
        for submission in submissions:
            submission["id"] = str(submission["_id"])
        return submissions
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch code submissions: {str(e)}"
        )

@app.get("/api/code/test-judge0")
async def test_judge0():
    try:
        # Simple Python code to test
        test_code = "print('Hello, World!')"
        
        # Prepare Judge0 payload
        judge0_payload = {
            "source_code": test_code,
            "language_id": 71,  # Python 3
            "stdin": ""
        }
        
        print("Testing Judge0 API connection...")
        print("Headers:", JUDGE0_HEADERS)
        print("Payload:", judge0_payload)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    JUDGE0_URL,
                    json=judge0_payload,
                    headers=JUDGE0_HEADERS
                )
                print("Response status:", response.status_code)
                print("Response headers:", response.headers)
                print("Response content:", response.text)
                
                response.raise_for_status()
                result = response.json()
                
                return {
                    "status": "success",
                    "message": "Judge0 API is working correctly",
                    "result": result
                }
                
            except httpx.TimeoutException:
                return {
                    "status": "error",
                    "message": "Judge0 API request timed out",
                    "error": "timeout"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "status": "error",
                    "message": f"Judge0 API error: {str(e)}",
                    "error": "http_error",
                    "status_code": e.response.status_code,
                    "response": e.response.text
                }
                
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
            "error": "unexpected"
        }

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys

    def handle_exit(sig, frame):
        print("\nShutting down gracefully...")
        sys.exit(0)

    # Register signal handlers
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # Configure uvicorn
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info",
        timeout_keep_alive=30,
        loop="asyncio",
        http="auto",
        ws="auto",
        lifespan="on"
    )
    
    try:
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        print(f"Error starting server: {str(e)}")
        sys.exit(1)