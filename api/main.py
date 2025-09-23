from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from firebase_admin import credentials, firestore, initialize_app
import firebase_admin
import os
import json
from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import time
from dotenv import load_dotenv
import uvicorn

# constants
PUSH_PAUSE_RATE = 5  # seconds between allowed pushes per user

# load environment variables
load_dotenv()

# initialize FastAPI
app = FastAPI()

# CORS middleware - restrict to production domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://iammusic-template.vercel.app", "https://iammusictemplate.xyz"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

# initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # get Firebase service account from environment variable
        service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')
        if not service_account_json:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable not set")
        
        service_account = json.loads(service_account_json)
        cred = credentials.Certificate(service_account)
        initialize_app(cred)
    
    return firestore.client()

# rate limiting storage (in production, use Redis or similar)
rate_limit_store = {}

class TextEntry(BaseModel):
    text: str
    ip: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    os: Optional[str] = None
    
    @validator('text')
    def validate_text(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Text cannot be empty')
        if len(v) > 25:
            raise ValueError('Text cannot exceed 25 characters')
        return v.strip()

def get_client_identifier(request: Request, entry: TextEntry) -> str:
    """Create a unique identifier for rate limiting"""
    # use IP + user agent for identification
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    identifier = hashlib.sha256(f"{ip}:{user_agent}".encode()).hexdigest()
    return identifier

def check_rate_limit(identifier: str) -> bool:
    """Allow only 1 request every 5 seconds per user"""
    now = time.time()
    last_request = rate_limit_store.get(identifier, 0)

    if now - last_request < PUSH_PAUSE_RATE:  # less than 5 seconds since last request
        return False

    # update last request time
    rate_limit_store[identifier] = now
    return True


async def check_duplicate_entry(db, entry: TextEntry) -> bool:
    """Check for duplicate entries in the last 10 minutes"""
    try:
        # get the most recent entry
        texts_ref = db.collection('texts')
        query = texts_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1)
        docs = query.stream()
        
        for doc in docs:
            recent_entry = doc.to_dict()
            recent_timestamp = recent_entry.get('timestamp')
            
            # check if within 10 minutes
            if recent_timestamp:
                time_diff = datetime.now(timezone.utc) - recent_timestamp
                ten_minutes = timedelta(minutes=10)
                
                if (time_diff < ten_minutes and 
                    recent_entry.get('text') == entry.text and
                    recent_entry.get('ip') == entry.ip and
                    recent_entry.get('os') == entry.os):
                    return True
        
        return False
        
    except Exception as e:
        print(f"Error checking duplicate: {e}")
        return False

@app.post("/api/save-text")
async def save_text(entry: TextEntry, request: Request):
    """Secure endpoint to save text entries"""
    try:
        # initialize Firestore
        db = initialize_firebase()
        
        # rate limiting
        client_id = get_client_identifier(request, entry)
        if not check_rate_limit(client_id):
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit exceeded. Please wait {PUSH_PAUSE_RATE} seconds before submitting again."
            )
        
        # check for duplicates
        if await check_duplicate_entry(db, entry):
            return {"message": "Duplicate entry detected, not saved", "saved": False}
        
        # reate the document
        doc_data = {
            "timestamp": datetime.now(timezone.utc),
            "text": entry.text,
            "ip": entry.ip,
            "country": entry.country,
            "region": entry.region,
            "city": entry.city,
            "location": entry.location,
            "os": entry.os
        }
        
        # save to Firestore
        doc_ref = db.collection('texts').add(doc_data)
        
        return {"message": "Text saved successfully", "saved": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving text: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# For Vercel deployment
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)