from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from celery import Celery
import socketio
import asyncio

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "progress_db"
REDIS_BROKER = "redis://localhost:6379/0"

app = FastAPI()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

celery = Celery("worker", broker=REDIS_BROKER, backend=REDIS_BROKER)

class ProgressIn(BaseModel):
    user_id: int
    completed_tasks: int
    total_tasks: int
    score: float
    time_spent: float

@app.post("/progress/update")
async def update_progress(data: ProgressIn):
    progress = {
        "user_id": data.user_id,
        "completed_tasks": data.completed_tasks,
        "total_tasks": data.total_tasks,
        "score": data.score,
        "time_spent": data.time_spent,
        "last_updated": datetime.utcnow(),
    }

    await db.progress.update_one(
        {"user_id": data.user_id},
        {"$set": progress},
        upsert=True,
    )

    analyze_progress.delay(data.user_id)
    return {"message": "Progress updated successfully!"}

@app.get("/progress/{user_id}")
async def get_progress(user_id: int):
    progress = await db.progress.find_one({"user_id": user_id})
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this user.")
    progress["_id"] = str(progress["_id"])
    return progress

@sio.on("get_notifications")
async def send_live_notifications(sid, data):
    user_id = data["user_id"]
    notifications = await db.notifications.find({"user_id": user_id, "status": "pending"}).to_list(length=10)
    await sio.emit(f"user_{user_id}_notification", [{"message": n["message"]} for n in notifications])

 
@celery.task
def analyze_progress(user_id: int):
    import pymongo
    client = pymongo.MongoClient(MONGO_URL)
    db = client[DB_NAME]

    progress = db.progress.find_one({"user_id": user_id})
    if not progress:
        return

    if progress["completed_tasks"] == progress["total_tasks"] and progress["total_tasks"] > 0:
        message = "🎉 Congratulations! You have completed all your tasks!"
    elif progress["score"] < 50:
        message = "📢 Your score is low. Consider reviewing the material again."
    elif progress["time_spent"] > 10:
        message = "⏳ You've been working hard! Take a short break."
    else:
        message = "Keep going! You're making progress."

    db.notifications.insert_one({
        "user_id": user_id,
        "message": message,
        "status": "pending",
        "created_at": datetime.utcnow(),
    })

    asyncio.run(sio.emit(f"user_{user_id}_notification", {"message": message}))
