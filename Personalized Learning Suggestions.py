from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

app = FastAPI()

 
client = MongoClient("mongodb://localhost:27017")
db = client["rubber_ducker_db"]
metrics_col = db["learning_metrics"]
suggestions_col = db["suggested_content"]

 
class SuggestedContentIn(BaseModel):
    title: str
    description: str
    difficulty: str

class SuggestedContentOut(SuggestedContentIn):
    id: str

def convert_suggestion(suggestion: dict) -> SuggestedContentOut:
    return SuggestedContentOut(
        id=str(suggestion["_id"]),
        title=suggestion["title"],
        description=suggestion["description"],
        difficulty=suggestion["difficulty"]
    )

@app.get("/suggestions/{user_id}", response_model=list[SuggestedContentOut])
def get_suggestions(user_id: int):
    metrics = metrics_col.find_one({"user_id": user_id})
    progress_level = metrics["progress_level"] if metrics else "Beginner"

    matched_suggestions = suggestions_col.find({"difficulty": progress_level})
    return [convert_suggestion(s) for s in matched_suggestions]

@app.post("/suggestions", status_code=201)
def add_suggestion(data: SuggestedContentIn):
    suggestion = data.dict()
    result = suggestions_col.insert_one(suggestion)
    return {"message": "Suggestion added successfully!", "id": str(result.inserted_id)}

 
class LearningMetricsIn(BaseModel):
    user_id: int
    coding_accuracy: float = 0.0
    average_score: float = 0.0
    progress_level: str = "Beginner"

@app.post("/metrics", status_code=201)
def update_metrics(data: LearningMetricsIn):
    metrics_col.update_one(
        {"user_id": data.user_id},
        {"$set": {
            "coding_accuracy": data.coding_accuracy,
            "average_score": data.average_score,
            "progress_level": data.progress_level,
            "last_updated": datetime.utcnow()
        }},
        upsert=True
    )
    return {"message": "Metrics updated successfully"}


