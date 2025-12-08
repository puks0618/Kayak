"""
Configuration Management for AI Agent Service
"""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # Application
    APP_NAME = "Kayak AI Agent"
    VERSION = "1.0.0"
    HOST = "0.0.0.0"
    PORT = int(os.getenv("PORT", 8000))
    
    # Ollama LLM
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
    OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.7"))
    OLLAMA_MAX_TOKENS = int(os.getenv("OLLAMA_MAX_TOKENS", "500"))
    
    # Kafka
    KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092").split(",")
    KAFKA_CONSUMER_GROUP = os.getenv("KAFKA_CONSUMER_GROUP", "ai-agent-consumers")
    
    # Kafka Topics
    TOPIC_RAW_FEEDS = "raw_supplier_feeds"
    TOPIC_NORMALIZED = "deals.normalized"
    TOPIC_SCORED = "deals.scored"
    TOPIC_TAGGED = "deals.tagged"
    TOPIC_EVENTS = "deal.events"
    TOPIC_USER_QUERIES = "user.queries"
    TOPIC_TRIP_PLANS = "trip.plans"
    
    # Redis
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
    
    # Database
    DB_PATH = os.getenv("DB_PATH", "/tmp/kayak_ai.db")
    DB_ECHO = os.getenv("DB_ECHO", "false").lower() == "true"
    
    # MySQL (for querying existing listings if needed)
    MYSQL_HOST = os.getenv("DB_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("DB_PORT", 3307))
    MYSQL_USER = os.getenv("DB_USER", "root")
    MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "Somalwar1!")
    MYSQL_DATABASE = os.getenv("DB_NAME", "kayak_listings")
    
    # Deal Detection Rules
    DEAL_PRICE_DROP_THRESHOLD = float(os.getenv("DEAL_PRICE_DROP_THRESHOLD", "15.0"))  # 15%
    DEAL_INVENTORY_THRESHOLD = int(os.getenv("DEAL_INVENTORY_THRESHOLD", "10"))
    DEAL_SCORE_MIN = int(os.getenv("DEAL_SCORE_MIN", "0"))  # Minimum score to qualify as deal (set to 0 for testing - show all deals)
    
    # Trip Planning
    MAX_BUNDLE_RECOMMENDATIONS = int(os.getenv("MAX_BUNDLE_RECOMMENDATIONS", "3"))
    FIT_SCORE_WEIGHTS = {
        "budget": 0.40,
        "amenities": 0.35,
        "location": 0.25
    }
    
    # Explanation Limits
    EXPLANATION_MAX_WORDS = int(os.getenv("EXPLANATION_MAX_WORDS", "25"))
    WATCH_ALERT_MAX_WORDS = int(os.getenv("WATCH_ALERT_MAX_WORDS", "12"))
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL = int(os.getenv("WS_HEARTBEAT_INTERVAL", "30"))  # seconds
    
    # Background Workers
    FEED_INGESTION_INTERVAL = int(os.getenv("FEED_INGESTION_INTERVAL", "300"))  # 5 minutes
    DEAL_DETECTION_INTERVAL = int(os.getenv("DEAL_DETECTION_INTERVAL", "60"))  # 1 minute
    WATCH_CHECK_INTERVAL = int(os.getenv("WATCH_CHECK_INTERVAL", "30"))  # 30 seconds
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get SQLite database URL"""
        return f"sqlite:///{cls.DB_PATH}"
    
    @classmethod
    def get_mysql_url(cls) -> str:
        """Get MySQL database URL"""
        return f"mysql+pymysql://{cls.MYSQL_USER}:{cls.MYSQL_PASSWORD}@{cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DATABASE}"
    
    @classmethod
    def get_redis_url(cls) -> str:
        """Get Redis URL"""
        if cls.REDIS_PASSWORD:
            return f"redis://:{cls.REDIS_PASSWORD}@{cls.REDIS_HOST}:{cls.REDIS_PORT}/{cls.REDIS_DB}"
        return f"redis://{cls.REDIS_HOST}:{cls.REDIS_PORT}/{cls.REDIS_DB}"

config = Config()
