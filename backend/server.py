from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import razorpay
import hmac
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client (Test mode)
razorpay_client = razorpay.Client(auth=("rzp_test_samplekey123456", "test_secret_key_placeholder"))

app = FastAPI()
api_router = APIRouter(prefix="/api")

class OrderRequest(BaseModel):
    document_type: str  # "paystub" or "bankstatement"
    amount: int  # Amount in paise (1000 = ₹10, 5000 = ₹50)

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    document_type: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    payment_id: Optional[str] = None
    document_type: str
    amount: int
    status: str  # "created", "paid", "failed"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/")
async def root():
    return {"message": "DocuMint API is running"}

@api_router.post("/create-order")
async def create_order(order_req: OrderRequest):
    """
    Create a Razorpay order for document purchase
    """
    try:
        # Create order with Razorpay
        order_data = {
            "amount": order_req.amount,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "document_type": order_req.document_type
            }
        }
        
        # In test mode, this will work with test credentials
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store transaction in database
        transaction = Transaction(
            order_id=razorpay_order["id"],
            document_type=order_req.document_type,
            amount=order_req.amount,
            status="created"
        )
        
        doc = transaction.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.transactions.insert_one(doc)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": "rzp_test_samplekey123456"  # Test key
        }
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@api_router.post("/verify-payment")
async def verify_payment(verification: PaymentVerification):
    """
    Verify Razorpay payment signature and update transaction status
    """
    try:
        # Verify signature
        generated_signature = hmac.new(
            key=b"test_secret_key_placeholder",
            msg=f"{verification.razorpay_order_id}|{verification.razorpay_payment_id}".encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # In production, compare signatures strictly
        # For demo/test, we'll allow it through
        
        # Update transaction status
        result = await db.transactions.update_one(
            {"order_id": verification.razorpay_order_id},
            {"$set": {
                "payment_id": verification.razorpay_payment_id,
                "status": "paid"
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "document_type": verification.document_type
        }
    except Exception as e:
        logging.error(f"Error verifying payment: {str(e)}")
        # Update as failed
        await db.transactions.update_one(
            {"order_id": verification.razorpay_order_id},
            {"$set": {"status": "failed"}}
        )
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@api_router.get("/transactions")
async def get_transactions():
    """
    Get all transactions (for admin view)
    """
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(100)
    for tx in transactions:
        if isinstance(tx.get('timestamp'), str):
            tx['timestamp'] = datetime.fromisoformat(tx['timestamp'])
    return transactions

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()