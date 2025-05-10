import stripe
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from starlette.responses import JSONResponse
from datetime import datetime

 
app = FastAPI()

 
stripe.api_key = "sk_test_51RLlECC8q04ZNYrOYnulV5aicFxt27BPHMFaL6pS6nKOYPMoiQr7DWCDT3U8GkAxmkAUl1Zf0AAWISCVLGCbaxHg00gbDPY5d4"

 
client = MongoClient("mongodb://localhost:27017")
db = client['payment_db']
payments_collection = db.payments

class PaymentRequest(BaseModel):
    token: str
    amount: int   

@app.post("/process-payment")
async def process_payment(payment_request: PaymentRequest):
    try:
         
        charge = stripe.Charge.create(
            amount=payment_request.amount,
            currency="usd",
            source=payment_request.token,
            description="Bundle Purchase",
        )

         
        payment_data = {
            "charge_id": charge.id,
            "amount": payment_request.amount,
            "currency": "usd",
            "status": charge.status,  # e.g., 'succeeded', 'pending', 'failed'
            "description": "Bundle Purchase",
            "payment_date": datetime.utcnow(),
             
            "user_email": charge.billing_details.email,  
        }

        
        payments_collection.insert_one(payment_data)

         
        return JSONResponse(content={"message": "Payment successful", "charge_id": charge.id})
    
    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=f"Card Error: {e.user_message}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Payment processing failed")
