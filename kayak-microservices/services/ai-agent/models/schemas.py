"""
Pydantic Schemas for AI Agent
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class DealSchema(BaseModel):
    """API schema for deals"""
    deal_id: str
    type: str  # flight, hotel
    title: str
    description: str
    price: float
    original_price: float
    discount_percent: float
    score: int
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    expires_at: Optional[datetime] = None
    created_at: datetime

class UserQuery(BaseModel):
    """User chat query"""
    user_id: Optional[str] = None
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    """Response to user query"""
    response: str
    intent: str
    entities: Dict[str, Any]
    confidence: float
    plans: Optional[List[Dict]] = None

class TripPlanRequest(BaseModel):
    """Trip planning request"""
    user_id: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None
    budget: Optional[float] = None
    party_size: int = 1
    preferences: List[str] = []

class TripPlanResponse(BaseModel):
    """Trip plan response"""
    plan_id: str
    itinerary: Dict[str, Any]
    fit_score: float
    total_cost: float
    explanation: str
    alternatives: List[Dict] = []

class PriceWatchRequest(BaseModel):
    """Create price watch"""
    user_id: str
    deal_id: str
    price_threshold: Optional[float] = None
    inventory_threshold: Optional[int] = None

class PriceWatchResponse(BaseModel):
    """Price watch response"""
    watch_id: str
    deal_id: str
    active: bool
    created_at: datetime

class PolicyQuestion(BaseModel):
    """Policy question request"""
    user_id: str
    deal_id: str
    question: str

class PolicyAnswer(BaseModel):
    """Policy answer response"""
    answer: str
    sources: List[str] = []

class DealEvent(BaseModel):
    """Deal change event for WebSocket"""
    event_type: str  # price_drop, inventory_low, new_deal, watch_alert
    deal_id: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FeedData(BaseModel):
    """Raw feed data from CSV"""
    feed_type: str  # flight, hotel
    data: Dict[str, Any]
    source: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

