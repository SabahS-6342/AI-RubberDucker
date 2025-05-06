from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from celery import Celery
from datetime import datetime
import socketio

DATABASE_URL = "postgresql://user:password@localhost/progress_db"
REDIS_BROKER = "redis://localhost:6379/0"

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

celery = Celery("worker", broker=REDIS_BROKER, backend=REDIS_BROKER)

class Progress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    completed_tasks = Column(Integer, default=0)
    total_tasks = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    time_spent = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notification"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    message = Column(String(500), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class ProgressIn(BaseModel):
    user_id: int
    completed_tasks: int
    total_tasks: int
    score: float
    time_spent: float

@app.post("/progress/update")
def update_progress(data: ProgressIn):
    db: Session = SessionLocal()
    progress = db.query(Progress).filter_by(user_id=data.user_id).first()
    if not progress:
        progress = Progress(user_id=data.user_id)

    progress.completed_tasks = data.completed_tasks
    progress.total_tasks = data.total_tasks
    progress.score = data.score
    progress.time_spent = data.time_spent
    progress.last_updated = datetime.utcnow()

    db.add(progress)
    db.commit()
    db.close()

    analyze_progress.delay(data.user_id)
    return {"message": "Progress updated successfully!"}

@app.get("/progress/{user_id}")
def get_progress(user_id: int):
    db: Session = SessionLocal()
    progress = db.query(Progress).filter_by(user_id=user_id).first()
    db.close()
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this user.")
    return {
        "user_id": progress.user_id,
        "completed_tasks": progress.completed_tasks,
        "total_tasks": progress.total_tasks,
        "score": progress.score,
        "time_spent": progress.time_spent,
        "last_updated": progress.last_updated
    }

@celery.task
def analyze_progress(user_id):
    db: Session = SessionLocal()
    progress = db.query(Progress).filter_by(user_id=user_id).first()
    if not progress:
        db.close()
        return

    if progress.completed_tasks == progress.total_tasks and progress.total_tasks > 0:
        message = "🎉 Congratulations! You have completed all your tasks!"
    elif progress.score < 50:
        message = "📢 Your score is low. Consider reviewing the material again."
    elif progress.time_spent > 10:
        message = "⏳ You've been working hard! Take a short break."
    else:
        message = "Keep going! You're making progress."

    new_notification = Notification(user_id=user_id, message=message)
    db.add(new_notification)
    db.commit()
    db.close()

    import asyncio
    loop = asyncio.get_event_loop()
    loop.create_task(sio.emit(f"user_{user_id}_notification", {"message": message}))

@sio.on("get_notifications")
async def send_live_notifications(sid, data):
    user_id = data["user_id"]
    db: Session = SessionLocal()
    notifications = db.query(Notification).filter_by(user_id=user_id, status="pending").all()
    await sio.emit(f"user_{user_id}_notification", [{"message": n.message} for n in notifications])
    db.close()
