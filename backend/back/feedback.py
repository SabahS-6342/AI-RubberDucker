from fastapi import FastAPI, Request
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

feedback_data = []

class Feedback(BaseModel):
    feedback: str
    comment: str = ""


@app.post("/api/feedback")
async def submit_feedback(feedback: Feedback, request: Request):
    feedback_entry = {
        "feedback": feedback.feedback,
        "comment": feedback.comment,
        "timestamp": datetime.utcnow().isoformat()
    }

    feedback_data.append(feedback_entry)
    print("Feedback received:", feedback_entry)

    return {"message": "Feedback submitted successfully"}

