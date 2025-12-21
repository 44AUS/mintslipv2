from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(title="MintSlip Analytics API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.mintslip_analytics

# Collections
documents_collection = db.documents
revenue_collection = db.revenue

# Models
class DocumentTrack(BaseModel):
    document_type: str  # paystub, w2, bank_statement, etc.
    template: Optional[str] = None
    amount: float
    payment_id: Optional[str] = None

class RevenueEntry(BaseModel):
    id: str
    document_type: str
    template: Optional[str]
    amount: float
    payment_id: Optional[str]
    created_at: datetime

class AnalyticsSummary(BaseModel):
    total_documents: int
    total_revenue: float
    documents_by_type: dict
    revenue_by_type: dict
    daily_stats: List[dict]

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/track/document")
async def track_document(data: DocumentTrack):
    """Track a document generation and payment"""
    entry = {
        "id": str(uuid.uuid4()),
        "document_type": data.document_type,
        "template": data.template,
        "amount": data.amount,
        "payment_id": data.payment_id,
        "created_at": datetime.utcnow()
    }
    
    await documents_collection.insert_one(entry)
    
    return {"success": True, "id": entry["id"]}

@app.get("/api/analytics/summary")
async def get_analytics_summary(days: int = 30):
    """Get analytics summary for the specified number of days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all documents in date range
    cursor = documents_collection.find({"created_at": {"$gte": start_date}})
    documents = await cursor.to_list(length=10000)
    
    # Calculate totals
    total_documents = len(documents)
    total_revenue = sum(doc.get("amount", 0) for doc in documents)
    
    # Group by document type
    documents_by_type = {}
    revenue_by_type = {}
    
    for doc in documents:
        doc_type = doc.get("document_type", "unknown")
        documents_by_type[doc_type] = documents_by_type.get(doc_type, 0) + 1
        revenue_by_type[doc_type] = revenue_by_type.get(doc_type, 0) + doc.get("amount", 0)
    
    # Daily stats
    daily_stats = []
    for i in range(days):
        day = datetime.utcnow() - timedelta(days=days-1-i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_docs = [d for d in documents if day_start <= d.get("created_at", datetime.min) < day_end]
        
        daily_stats.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "documents": len(day_docs),
            "revenue": sum(d.get("amount", 0) for d in day_docs)
        })
    
    return {
        "total_documents": total_documents,
        "total_revenue": total_revenue,
        "documents_by_type": documents_by_type,
        "revenue_by_type": revenue_by_type,
        "daily_stats": daily_stats
    }

@app.get("/api/analytics/documents")
async def get_recent_documents(limit: int = 100, skip: int = 0):
    """Get recent document entries"""
    cursor = documents_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    documents = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    
    return {"documents": documents, "total": await documents_collection.count_documents({})}

@app.get("/api/analytics/by-type")
async def get_analytics_by_type(days: int = 30):
    """Get document counts and revenue grouped by type"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$document_type",
            "count": {"$sum": 1},
            "revenue": {"$sum": "$amount"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    cursor = documents_collection.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    
    return {"data": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
