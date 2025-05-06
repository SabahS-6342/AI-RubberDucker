from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, SessionLog, CodingExercise, AIConversation

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")

    now = datetime.utcnow()
    start_of_week = now - timedelta(days=now.weekday())
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_sessions = db.query(SessionLog).filter_by(user_id=user_id).count()
    coding_exercises = db.query(CodingExercise).filter_by(user_id=user_id).count()
    exercises_this_week = db.query(CodingExercise).filter(
        CodingExercise.user_id == user_id,
        CodingExercise.completed_at >= start_of_week
    ).count()
    ai_conversations = db.query(AIConversation).filter_by(user_id=user_id).count()
    new_today = db.query(AIConversation).filter(
        AIConversation.user_id == user_id,
        AIConversation.started_at >= start_of_day
    ).count()

    return {
        "user_id": user_id,
        "total_sessions": total_sessions,
        "coding_exercises": coding_exercises,
        "exercises_completed_this_week": exercises_this_week,
        "ai_conversations": ai_conversations,
        "new_today": new_today
    }
