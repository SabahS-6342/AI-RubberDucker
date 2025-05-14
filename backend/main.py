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
from pydantic import BaseModel, Field, field_validator
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
import torch
from fastapi.staticfiles import StaticFiles
import json

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
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    id: str
    material_category: str
    exercise_title: str
    exercise_description: str
    testcases: str
    difficulty_level: str = Field(..., pattern=r"^(Beginner|Intermediate|Advanced)$")

class UserFeedback(BaseModel):
    id: str
    user_id: str
    message: str = Field(..., min_length=1, max_length=1000)
    feedback_timestamp: datetime

class CodeSubmission(BaseModel):
    id: str
    user_id: str
    exercise_id: str
    code: str
    language: str = Field(..., pattern=r"^(python|javascript|java|c\+\+)$")
    submission_date: datetime
    status: str = Field(..., pattern=r"^(pending|success|failed)$")
    score: Optional[int] = Field(None, ge=0, le=100)
    feedback: Optional[str] = None

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

# Add new model for profile updates
class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    image_url: Optional[str] = None

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
        token_response = requests.post("https://oauth2.googleapis.com/token", data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        # Get user info
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
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
        
        # Generate tokens
        access_token = create_access_token({"sub": user_info["email"]})
        refresh_token = create_access_token(
            {"sub": user_info["email"], "type": "refresh"},
            expires_delta=timedelta(days=30)
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to communicate with Google: {str(e)}"
        )
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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

# Initialize Llama configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"  # Changed back to llama3

def generate_response(user_input: str, chat_history: List[Dict] = None) -> str:
    """Generate a response using Llama model with conversation context."""
    try:
        # Format conversation history
        full_prompt = ""
        if chat_history:
            for msg in chat_history[-5:]:  # Use last 5 messages for context to reduce token usage
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role and content:
                    full_prompt += f"{role}: {content}\n"
        
        # Add current user input
        full_prompt += f"User: {user_input}\nAssistant:"

        # Call Ollama API with optimized parameters
        response = requests.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "num_ctx": 1024,      # Smaller context for chat
                "num_predict": 150,    # More tokens for chat responses
                "temperature": 0.7     # Balanced creativity
            }
        })
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.text}")
            
        response_text = response.json()["response"].strip()
        
        # Fallback for short responses
        if len(response_text) < 20:
            response_text = "I understand you're interested in programming. Could you please rephrase your question or let me know what specific topic you'd like to learn about?"
            
        return response_text

    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. Could you please try asking your question again?"

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

        # Create timestamp for both messages
        now = datetime.now(UTC)
        
        # Create message objects
        user_message = {
            "role": "user",
            "content": message.message,
            "timestamp": now.isoformat()
        }

        # Generate response using Llama
        response = generate_response(message.message)
        
        ai_message = {
            "role": "assistant",
            "content": response,
            "timestamp": now.isoformat()
        }

        # Save user message as chatbot interaction
        user_interaction = {
            "user_id": str(current_user["_id"]),
            "question": message.message,
            "bot_response": response,
            "timestamp": now,
            "topic": message.topic or "general",
            "is_followup": False,
            "role": "user"
        }
        chatbot_interactions_collection.insert_one(user_interaction)

        # Save AI response as chatbot interaction
        ai_interaction = {
            "user_id": str(current_user["_id"]),
            "question": message.message,
            "bot_response": response,
            "timestamp": now,
            "topic": message.topic or "general",
            "is_followup": True,
            "role": "assistant"
        }
        chatbot_interactions_collection.insert_one(ai_interaction)

        # Get or create chat session
        session = chat_sessions_collection.find_one({
            "user_id": str(current_user["_id"]),
            "is_active": True
        })

        if not session:
            # Create new session with default title
            session_data = {
                "user_id": str(current_user["_id"]),
                "title": "New Conversation",
                "topic": message.topic or "general",
                "created_at": now,
                "last_updated": now,
                "messages": [user_message, ai_message],
                "is_active": True
            }
            result = chat_sessions_collection.insert_one(session_data)
            session_id = str(result.inserted_id)
        else:
            # Update existing session
            chat_sessions_collection.update_one(
                {"_id": session["_id"]},
                {
                    "$push": {"messages": {"$each": [user_message, ai_message]}},
                    "$set": {"last_updated": now}
                }
            )
            session_id = str(session["_id"])

        return {
            "response": response,
            "history": [user_message, ai_message],
            "title": session.get("title", "New Chat"),
            "session_id": session_id
        }

    except Exception as e:
        logger.error(f"Error in direct chat endpoint: {str(e)}")
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
        
        # Create timestamp for both messages
        now = datetime.now(UTC)
        
        # Create message objects
        user_message = {
            "role": "user",
            "content": message.message,
            "timestamp": now.isoformat()
        }

        # Generate response using Llama
        response = generate_response(
            message.message,
            session.get("messages", [])
        )
        
        ai_message = {
            "role": "assistant",
            "content": response,
            "timestamp": now.isoformat()
        }

        # Save user message as chatbot interaction
        user_interaction = {
            "user_id": str(current_user["_id"]),
            "question": message.message,
            "bot_response": response,
            "timestamp": now,
            "topic": session.get("topic", "general"),
            "is_followup": True,
            "role": "user",
            "session_id": session_id
        }
        chatbot_interactions_collection.insert_one(user_interaction)

        # Save AI response as chatbot interaction
        ai_interaction = {
            "user_id": str(current_user["_id"]),
            "question": message.message,
            "bot_response": response,
            "timestamp": now,
            "topic": session.get("topic", "general"),
            "is_followup": True,
            "role": "assistant",
            "session_id": session_id
        }
        chatbot_interactions_collection.insert_one(ai_interaction)

        # Update session with new messages
        chat_sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "messages": {"$each": [user_message, ai_message]}
                },
                "$set": {
                    "last_updated": now
                }
            }
        )

        return {
            "response": response,
            "history": session.get("messages", []) + [user_message, ai_message],
            "title": session.get("title", "Chat Session"),
            "session_id": session_id
        }

    except Exception as e:
        logger.error(f"Error in session chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )

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
        
        try:
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
        except Exception as e:
            logger.error(f"Error reading PDF: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to read PDF file. Please ensure it's a valid PDF."
            )

        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content found in the PDF"
            )

        # Create a prompt for Ollama
        prompt = f"""Please analyze and summarize the following text. Provide:
1. A concise summary (2-3 sentences)
2. Key points as a bullet list
3. Main topics covered

Text to analyze:
{text[:2000]}  # First 2000 characters for context

Format your response as:
SUMMARY:
[Your summary here]

KEY POINTS:
- [Point 1]
- [Point 2]
etc.

TOPICS:
- [Topic 1]
- [Topic 2]
etc."""

        try:
            # Call Ollama API for summary
            response = requests.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_ctx": 2048,      # Context window size
                    "num_predict": 100,   # Max tokens to generate
                    "temperature": 0.7    # Balance between creativity and consistency
                }
            })
            
            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service is currently unavailable. Please try again later."
                )
                
            summary_text = response.json()["response"].strip()

            # Parse the response into sections
            sections = summary_text.split('\n\n')
            main_summary = ""
            key_points = []
            topics = []

            for section in sections:
                if section.startswith("SUMMARY:"):
                    main_summary = section.replace("SUMMARY:", "").strip()
                elif section.startswith("KEY POINTS:"):
                    points = section.replace("KEY POINTS:", "").strip().split('\n')
                    key_points = [point.strip('- ').strip() for point in points if point.strip()]
                elif section.startswith("TOPICS:"):
                    topic_list = section.replace("TOPICS:", "").strip().split('\n')
                    topics = [topic.strip('- ').strip() for topic in topic_list if topic.strip()]

            if not main_summary:
                main_summary = "Unable to generate a summary. Please try again."

            # Store the interaction
            interaction = {
                "user_id": str(current_user["_id"]),
                "question": f"PDF Summary Request: {file.filename}",
                "bot_response": summary_text,
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

        except requests.RequestException as e:
            logger.error(f"Ollama API request error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable. Please try again later."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {str(e)}"
        )

@app.get("/api/chat/history")
async def get_chat_history(current_user: User = Depends(get_current_user)):
    """Get chat history for the current user"""
    try:
        # Get all chat sessions for the user, ordered by most recent first
        cursor = chat_sessions_collection.find(
            {"user_id": str(current_user["_id"])}
        ).sort("last_updated", -1)
        
        # Convert cursor to list
        chat_sessions = list(cursor)
        
        # Format the response
        chat_history = []
        for session in chat_sessions:
            # Calculate duration in minutes
            duration = 0
            if session.get("created_at") and session.get("last_updated"):
                duration = int((session["last_updated"] - session["created_at"]).total_seconds() / 60)
            
            # Get the last message content
            last_message = None
            if session.get("messages"):
                last_message = session["messages"][-1]["content"] if session["messages"] else None
            
            chat_history.append({
                "id": str(session["_id"]),
                "title": session.get("title", "Untitled Chat"),
                "topic": session.get("topic"),
                "created_at": session["created_at"],
                "last_updated": session.get("last_updated", session["created_at"]),
                "duration": duration,
                "message_count": len(session.get("messages", [])),
                "last_message": last_message
            })
        
        return chat_history
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch chat history"
        )

@app.delete("/api/chat/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a specific chat"""
    try:
        # Verify the chat belongs to the user
        chat = await db.chats.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user["id"]
        })
        
        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found"
            )
        
        # Delete the chat
        await db.chats.delete_one({"_id": ObjectId(chat_id)})
        
        return {"message": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete chat"
        )

@app.get("/api/users/progress")
async def get_user_progress(current_user: dict = Depends(get_current_user)):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        user_id = str(current_user["_id"])
        
        try:
            # Get total number of topics
            total_topics = len(learning_paths_collection.distinct("topics"))
            
            # Get user's completed topics
            completed_topics = set()
            user_sessions = chatbot_interactions_collection.find({"user_id": user_id})
            for session in user_sessions:
                if session.get("topic"):
                    completed_topics.add(session["topic"])
            
            # Calculate overall progress
            overall_progress = (len(completed_topics) / total_topics * 100) if total_topics > 0 else 0
            
            # Calculate current streak
            today = datetime.now(UTC).date()
            streak = 0
            current_date = today
            
            while True:
                # Check if user had any activity on this date
                start_of_day = datetime.combine(current_date, datetime.min.time()).replace(tzinfo=UTC)
                end_of_day = datetime.combine(current_date, datetime.max.time()).replace(tzinfo=UTC)
                
                has_activity = chatbot_interactions_collection.find_one({
                    "user_id": user_id,
                    "timestamp": {
                        "$gte": start_of_day,
                        "$lte": end_of_day
                    }
                })
                
                if not has_activity:
                    break
                    
                streak += 1
                current_date = current_date - timedelta(days=1)
            
            return {
                "overall_progress": round(overall_progress, 1),
                "current_streak": streak,
                "topics_mastered": {
                    "count": len(completed_topics),
                    "total": total_topics,
                    "topics": list(completed_topics)
                }
            }
            
        except errors.PyMongoError as e:
            print(f"MongoDB error in user progress: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in user progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.put("/api/users/profile")
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        user_id = str(current_user["_id"])
        
        # Prepare update data
        update_data = {}
        if profile_data.bio is not None:
            update_data["bio"] = profile_data.bio
        if profile_data.image_url is not None:
            update_data["image_url"] = profile_data.image_url
            
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid update data provided"
            )
            
        # Update user profile
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or no changes made"
            )
            
        # Get updated user data
        updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
        updated_user["id"] = str(updated_user["_id"])
        
        return {
            "message": "Profile updated successfully",
            "user": updated_user
        }
        
    except errors.PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@app.post("/api/users/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        if not current_user or not current_user.get("_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated or invalid user data"
            )

        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )

        # Read file content
        contents = await file.read()
        
        # Validate file size (max 5MB)
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )

        # Create a unique filename
        file_extension = file.filename.split('.')[-1]
        filename = f"profile_{current_user['_id']}_{int(time.time())}.{file_extension}"
        
        # Save file to static directory
        static_dir = os.path.join(os.path.dirname(__file__), "static")
        os.makedirs(static_dir, exist_ok=True)
        file_path = os.path.join(static_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(contents)

        # Update user profile with image URL
        image_url = f"/profile_pictures/{filename}"
        users_collection.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"image_url": image_url}}
        )

        return {
            "message": "Profile picture uploaded successfully",
            "picture_url": image_url
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

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