from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, errors
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
import urllib.parse
import traceback
import requests
from jose import JWTError, jwt

from datetime import datetime, timedelta
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


# Load and validate environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env") #path to .env file
load_dotenv(dotenv_path=dotenv_path)

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Session middleware for temporary storage
app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET_KEY"))

# MongoDB connection with error handling
try:
    client = MongoClient(os.getenv('MONGODB_URL'), serverSelectionTimeoutMS=10000)
    client.server_info()  # Test connection
except errors.ServerSelectionTimeoutError:
    raise Exception("Could not connect to MongoDB server")
except errors.ConnectionFailure:
    raise Exception("MongoDB connection failed")

db = client['airubberduckerdb']

# Collections
users_collection = db['users']
subscription_collection = db['subscription']
chat_sessions_collection = db['chat_sessions']
messages_collection = db['messages']
coding_exercises_collection = db['coding_exercises']
user_feedback_collection = db['user_feedback']
code_submissions_collection = db['code_submissions']
study_materials_collection = db['study_materials']
learning_paths_collection = db['learning_paths']

# Constants
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
        
        # Chat Sessions collection
        chat_sessions_collection.create_index([("user_id", 1)])
        chat_sessions_collection.create_index([("timestamp", 1)])
        
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
    preferences: str = "light-mode"
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



class UserLogin(BaseModel):
    email: str
    password: str
    

    

class UserCreate(UserBase):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8)
    verified: bool = False
    subscription_id: Optional[str] = None
    interactioncount: int = 0
    maxdailyinteractions: int = 3
    preferences: str = "light-mode"
    progress: str = "0%"
    status: str = "active"
    
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

class Message(BaseModel):
    id: str
    session_id: str
    sender: str = Field(..., pattern=r"^(Bot|User)$")
    message: str
    timestamp: datetime
    

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



def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password hashing failed: {str(e)}"
        )
def create_access_token(data: dict, expires_delta: timedelta = None):
    try:    
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
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
    except jwt.JWTError:
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
        
        active_sessions = chat_sessions_collection.count_documents({
            "timestamp": {
                "$gte": datetime.utcnow() - timedelta(minutes=30)
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
        user_data = {
            "email": user_info["email"],
            "username": user_info.get("name", ""),
            "verified": True,
            "created_at": datetime.utcnow()
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
@app.post("/token/refresh")
async def refresh_token(
    refresh_token: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid refresh token"
            )
        
        new_access_token = create_access_token({"sub": payload.get("sub")})
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
 
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from pymongo import MongoClient
from bson.objectid import ObjectId
from pydantic import BaseModel
from datetime import timedelta


# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper function to verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password verification failed: {str(e)}"
        )


@app.post("/api/auth/login")
async def login(user_login: UserLogin):
    try:
        # Find user by email in MongoDB
        
        email = user_login.email.strip().lower()
        password = user_login.password
        
        user = users_collection.find_one({"email": email})
        
        # If user does not exist, return an error
        if user is None:
            print("wrong username?")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if password matches the stored hash
        if (user is not None) and not verify_password(password, user["password"]):
            print("wrong pass")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Optionally, return user details (excluding password)
        user_data = {
            "email": user["email"],
            "username": user.get("username", ""),
            "verified": user.get("verified", False)
        }
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    except Exception as e:
        print("Exception during login:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
@app.post("/api/auth/google")
async def verify_google_token(token: str):
    print(f"Received token: {token}")
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
        user_data = {
            "email": user_info["email"],
            "username": user_info.get("name", ""),
            "verified": True,
            "created_at": datetime.utcnow()
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
        print("Google token verification failed:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to verify Google token: {str(e)}"
        )
    except errors.PyMongoError as e:
        print("MongoDB error:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        print("Unexpected server error:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected server error"
        )

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    try:
        # Get user's learning sessions count
        sessions_count = chat_sessions_collection.count_documents({})
        
        # Get topics explored (unique topics from chatbot sessions)
        topics = chat_sessions_collection.distinct("topic")
        topics_count = len(topics)
        
        # Get new topics this week
        week_ago = datetime.now() - timedelta(days=7)
        new_topics = chat_sessions_collection.distinct("topic", {"timestamp": {"$gte": week_ago}})
        new_topics_count = len(new_topics)
        
        # Calculate learning progress
        total_exercises = coding_exercises_collection.count_documents({})
        completed_exercises = code_submissions_collection.count_documents({"status": "completed"})
        progress_percentage = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
        
        # Calculate progress increase today
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        exercises_today = code_submissions_collection.count_documents({
            "status": "completed",
            "submission_date": {"$gte": today}
        })
        progress_increase = (exercises_today / total_exercises * 100) if total_exercises > 0 else 0
        
        return {
            "sessions": {
                "count": sessions_count,
                "increase": "10%"  # This could be calculated based on previous period
            },
            "topics": {
                "count": topics_count,
                "new_this_week": new_topics_count
            },
            "progress": {
                "percentage": f"{progress_percentage:.1f}%",
                "increase": f"{progress_increase:.1f}%"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity(current_user: Optional[dict] = Depends(get_current_user)):
    try:
        # Initialize empty lists for activities
        activities = []
        
        # Get recent chatbot sessions if user is authenticated
        if current_user:
            try:
                recent_chatbot = list(chat_sessions_collection.find(
                    {"user_id": str(current_user["_id"])},
                    {"_id": 0, "question": 1, "timestamp": 1}
                ).sort("timestamp", -1).limit(5))
                
                for chat in recent_chatbot:
                    activities.append({
                        "title": f"Chatbot Interaction: {chat['question'][:50]}...",
                        "status": "completed",
                        "timestamp": chat["timestamp"]
                    })
            except Exception as e:
                print(f"Error fetching chat sessions: {str(e)}")
        
        # Get recent code submissions if user is authenticated
        if current_user:
            try:
                recent_submissions = list(code_submissions_collection.find(
                    {"user_id": str(current_user["_id"])},
                    {"_id": 0, "exercise_id": 1, "status": 1, "submission_date": 1}
                ).sort("submission_date", -1).limit(5))
                
                for sub in recent_submissions:
                    activities.append({
                        "title": f"Code Submission: Exercise {sub['exercise_id']}",
                        "status": sub["status"],
                        "timestamp": sub["submission_date"]
                    })
            except Exception as e:
                print(f"Error fetching code submissions: {str(e)}")
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Format activities and limit to 5 most recent
        formatted_activities = []
        for activity in activities[:5]:
            formatted_activities.append({
                "title": activity["title"],
                "status": activity["status"]
            })
        
        return formatted_activities
    except Exception as e:
        print(f"Error in recent activity endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching recent activity"
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

# Chatbot models
class ChatRequest(BaseModel):
    message: str
    topic: Optional[str] = None
    difficulty_level: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    history: List[str]
    suggested_topics: Optional[List[str]] = None
    learning_resources: Optional[List[Dict[str, str]]] = None

# Chatbot functions
def search_learning_materials(topic: str, difficulty_level: str = None):
    query = {"topic": topic}
    if difficulty_level:
        query["difficulty_level"] = difficulty_level
    
    materials = list(study_materials_collection.find(query).limit(3))
    return [{
        "title": m["title"],
        "type": m["type"],
        "url": m["url"],
        "description": m["description"]
    } for m in materials]

def search_coding_exercises(topic: str, difficulty_level: str = None):
    query = {"topic": topic}
    if difficulty_level:
        query["difficulty_level"] = difficulty_level
    
    exercises = list(coding_exercises_collection.find(query).limit(3))
    return [{
        "title": e["title"],
        "description": e["description"],
        "difficulty": e["difficulty_level"]
    } for e in exercises]

def get_suggested_topics(current_topic: str = None):
    if current_topic:
        # Get related topics from learning paths
        paths = learning_paths_collection.find({"topics": current_topic})
        related_topics = set()
        for path in paths:
            related_topics.update(path["topics"])
        related_topics.discard(current_topic)
        return list(related_topics)[:5]
    else:
        # Get popular topics
        topics = chat_sessions_collection.aggregate([
            {"$group": {"_id": "$topic", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ])
        return [t["_id"] for t in topics]

def is_code(text: str) -> bool:
    """Check if the text contains code blocks or looks like code."""
    code_indicators = ['```', 'def ', 'class ', 'import ', 'function ', 'const ', 'let ', 'var ']
    return any(indicator in text for indicator in code_indicators)

def provide_code_feedback(code: str) -> str:
    """Analyze code using GPT model and provide detailed feedback."""
    try:
        # Prepare the prompt for code analysis
        prompt = f"""Analyze this code and provide detailed feedback:
{code}

Please provide feedback on:
1. Code correctness and potential bugs
2. Performance optimization opportunities
3. Best practices and code style
4. Security considerations
5. Alternative approaches if applicable

Format the response in a clear, structured way."""

        # Generate response using the model
        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
        output = model.generate(**inputs, max_length=500, num_return_sequences=1)
        feedback = tokenizer.decode(output[0], skip_special_tokens=True)
        
        return feedback
    except Exception as e:
        return f"Error analyzing code: {str(e)}"

def generate_response(user_input: str, user_id: str, topic: str = None, difficulty_level: str = None):
    # Get or create chat history for user
    user_chat = chat_sessions_collection.find_one({"user_id": user_id})
    if not user_chat:
        chat_history = []
    else:
        chat_history = user_chat.get("history", [])
    
    chat_history.append(f"User: {user_input}")

    # Get learning materials and exercises
    learning_resources = []
    if topic:
        learning_resources.extend(search_learning_materials(topic, difficulty_level))
        learning_resources.extend(search_coding_exercises(topic, difficulty_level))

    # Generate response based on input type
    if is_code(user_input):
        feedback = provide_code_feedback(user_input)
        chat_history.append(f"AI: {feedback}")
        response = feedback
    else:
        # Try to find relevant learning materials
        if learning_resources:
            response = "Here are some resources that might help:\n"
            for resource in learning_resources:
                response += f"- {resource['title']}: {resource.get('description', '')}\n"
        else:
            # Use GPT-2 for general responses
            input_text = "\n".join(chat_history) + "\nAI:"
            inputs = tokenizer(input_text, return_tensors="pt")
            output = model.generate(**inputs, max_length=150, pad_token_id=tokenizer.eos_token_id)
            response = tokenizer.decode(output[0], skip_special_tokens=True)
            chat_history.append(f"AI: {response}")

    # Get suggested topics
    suggested_topics = get_suggested_topics(topic)

    # Update chat history in database
    chat_history = chat_history[-10:]  # Limit history
    chat_sessions_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "history": chat_history,
                "last_interaction": datetime.utcnow(),
                "topic": topic,
                "difficulty_level": difficulty_level
            }
        },
        upsert=True
    )

    return response, chat_history, suggested_topics, learning_resources

# Chatbot endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[dict] = Depends(get_current_user)
):
    try:
        user_input = request.message.strip()
        if not user_input:
            raise HTTPException(status_code=400, detail="Empty message")

        # Use a default user ID if not authenticated
        user_id = str(current_user["_id"]) if current_user else "anonymous"
        
        # Generate response
        response, history, suggested_topics, learning_resources = generate_response(
            user_input,
            user_id,
            request.topic,
            request.difficulty_level
        )
        
        # Update user interaction count if authenticated
        if current_user:
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$inc": {"interactioncount": 1}}
            )

        return {
            "response": response,
            "history": history,
            "suggested_topics": suggested_topics,
            "learning_resources": learning_resources
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Log the error
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)