from fastapi import FastAPI, APIRouter
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str
    document_type: str
    template: str
    amount: float
    status: str  # "completed"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/")
async def root():
    return {"message": "DocuMint API is running"}

@api_router.post("/record-purchase")
async def record_purchase(transaction: Transaction):
    """
    Record a successful PayPal purchase
    """
    try:
        doc = transaction.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.transactions.insert_one(doc)
        return {"success": True, "message": "Purchase recorded"}
    except Exception as e:
        logging.error(f"Error recording purchase: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.get("/transactions")
async def get_transactions():
    """
    Get all transactions
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