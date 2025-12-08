"""
Database Models using SQLModel
"""

from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, create_engine, Session
from config import config
import json

class Deal(SQLModel, table=True):
    """Deal entity stored in database"""
    __tablename__ = "deals"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deal_id: str = Field(unique=True, index=True)
    type: str  # flight, hotel
    title: str
    description: str
    price: float
    original_price: float
    avg_30d_price: Optional[float] = Field(default=None)  # 30-day rolling average for deal detection
    discount_percent: float
    score: int  # 0-100
    tags: str  # JSON array as string
    deal_metadata: str  # JSON object as string
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True
    
    def get_tags(self) -> List[str]:
        """Parse tags from JSON string"""
        try:
            return json.loads(self.tags) if self.tags else []
        except:
            return []
    
    def set_tags(self, tags: List[str]):
        """Set tags as JSON string"""
        self.tags = json.dumps(tags)
    
    def get_metadata(self) -> dict:
        """Parse deal_metadata from JSON string"""
        try:
            return json.loads(self.deal_metadata) if self.deal_metadata else {}
        except:
            return {}
    
    def set_metadata(self, metadata: dict):
        """Set deal_metadata as JSON string"""
        self.deal_metadata = json.dumps(metadata)


class UserPreference(SQLModel, table=True):
    """User preferences and search history"""
    __tablename__ = "user_preferences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    preferences: str  # JSON
    search_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_preferences(self) -> dict:
        """Parse preferences from JSON string"""
        try:
            return json.loads(self.preferences) if self.preferences else {}
        except:
            return {}
    
    def set_preferences(self, prefs: dict):
        """Set preferences as JSON string"""
        self.preferences = json.dumps(prefs)


class TripPlan(SQLModel, table=True):
    """Generated trip plans"""
    __tablename__ = "trip_plans"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: str = Field(unique=True, index=True)
    user_id: str = Field(index=True)
    query: str
    itinerary: str  # JSON
    fit_score: float
    total_cost: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_itinerary(self) -> dict:
        """Parse itinerary from JSON string"""
        try:
            return json.loads(self.itinerary) if self.itinerary else {}
        except:
            return {}
    
    def set_itinerary(self, itinerary: dict):
        """Set itinerary as JSON string"""
        self.itinerary = json.dumps(itinerary)


class PriceWatch(SQLModel, table=True):
    """Price and inventory watches"""
    __tablename__ = "price_watches"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    watch_id: str = Field(unique=True, index=True)
    user_id: str = Field(index=True)
    deal_id: str = Field(index=True)
    price_threshold: Optional[float] = None
    inventory_threshold: Optional[int] = None
    active: bool = True
    last_notified: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(SQLModel, table=True):
    """Chat conversation history"""
    __tablename__ = "conversations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default="anonymous", index=True)
    message: str
    response: str
    intent: str
    entities: str  # JSON
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_entities(self) -> dict:
        """Parse entities from JSON string"""
        try:
            return json.loads(self.entities) if self.entities else {}
        except:
            return {}
    
    def set_entities(self, entities: dict):
        """Set entities as JSON string"""
        self.entities = json.dumps(entities)


class PriceHistory(SQLModel, table=True):
    """Track historical prices for deals"""
    __tablename__ = "price_history"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deal_id: str = Field(index=True)
    price: float
    available_inventory: Optional[int] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


# Database Engine and Session
engine = create_engine(config.get_database_url(), echo=config.DB_ECHO)

def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session"""
    return Session(engine)
