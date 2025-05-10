from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, Float, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "postgresql://user:password@localhost/rubber_ducker_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

class LearningMetrics(Base):
    __tablename__ = "learning_metrics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)
    coding_accuracy = Column(Float, default=0.0)
    average_score = Column(Float, default=0.0)
    progress_level = Column(String(20), default="Beginner")
    last_updated = Column(DateTime, default=datetime.utcnow)

class SuggestedContent(Base):
    __tablename__ = "suggested_content"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False)

Base.metadata.create_all(bind=engine)

class SuggestedContentIn(BaseModel):
    title: str
    description: str
    difficulty: str

class SuggestedContentOut(SuggestedContentIn):
    id: int
    class Config:
        orm_mode = True

@app.get("/suggestions/{user_id}", response_model=list[SuggestedContentOut])
def get_suggestions(user_id: int):
    db = SessionLocal()
    metrics = db.query(LearningMetrics).filter(LearningMetrics.user_id == user_id).first()
    if not metrics:
        db.close()
        raise HTTPException(status_code=404, detail="No learning metrics found. Defaulting to beginner.")
    suggestions = db.query(SuggestedContent).filter(SuggestedContent.difficulty == metrics.progress_level).all()
    db.close()
    return suggestions

@app.post("/suggestions", status_code=201)
def add_suggestion(data: SuggestedContentIn):
    db = SessionLocal()
    new_suggestion = SuggestedContent(
        title=data.title,
        description=data.description,
        difficulty=data.difficulty
    )
    db.add(new_suggestion)
    db.commit()
    db.refresh(new_suggestion)
    db.close()
    return {"message": "Suggestion added successfully!"}

