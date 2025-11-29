"""
Pydantic Schemas for AI Agent
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Deal(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    price: float
    original_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    listing_type: str  # flight, hotel, car
    tags: List[str] = []
    score: float = 0.0
    expires_at: Optional[datetime] = None

class UserQuery(BaseModel):
    query: str
    user_id: Optional[str] = None
    context: Optional[dict] = {}

class TripPlan(BaseModel):
    destination: str
    start_date: datetime
    end_date: datetime
    budget: Optional[float] = None
    preferences: Optional[dict] = {}
    itinerary: List[dict] = []

