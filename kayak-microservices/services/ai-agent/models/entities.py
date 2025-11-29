"""
SQLModel Entities for AI Agent
"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class DealEntity(SQLModel, table=True):
    __tablename__ = "deals"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    price: float
    listing_type: str
    score: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserPreference(SQLModel, table=True):
    __tablename__ = "user_preferences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    preferences: str  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)

