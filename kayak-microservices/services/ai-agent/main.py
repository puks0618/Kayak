"""
AI Agent Service Main Entry Point
FastAPI application for deals detection and AI concierge with OpenAI and Kafka
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
from datetime import datetime
import asyncio
import uuid
import json
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models and schemas
from models.schemas import (
    DealSchema, UserQuery, ChatResponse, TripPlanRequest, TripPlanResponse,
    PriceWatchRequest, PriceWatchResponse, PolicyQuestion, PolicyAnswer
)
from models.database import init_db, get_session, Deal, PriceWatch, UserPreference
from models.db_utils import create_indexes, check_db_health, DBMetrics

# Import services
from services.kafka_service import kafka_service, init_kafka
from services.websocket_service import ws_service
from services.openai_service import generate_explanation, answer_policy_question, compare_deals, generate_watch_alert
from services.cache_service import ai_cache, CacheMetrics

# Import agents
from agents.deal_detector import DealDetector
from agents.intent_parser import IntentParser
from agents.trip_planner import TripPlannerAgent
from agents.explanation_engine import ExplanationEngine, generate_deal_insights
from config import config

# Import workers
from workers.kafka_workers import start_kafka_workers, start_periodic_ingestion
from workers.watch_monitor import start_watch_monitor
from workers.hot_deal_monitor import start_hot_deal_monitor

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting AI Agent Service...")
    init_db()
    print("✅ Database initialized")
    
    # Create performance indexes
    print("📊 Creating database indexes...")
    create_indexes()
    print("✅ Database indexes created")
    
    # Warm up AI cache
    print("🔥 Warming up AI cache...")
    ai_cache.warm_up_cache()
    print("✅ AI cache warmed up")
    
    # Try to initialize Kafka (optional - gracefully skip if unavailable)
    try:
        await init_kafka()
        print("✅ Kafka initialized")
        
        # Start background workers for Kafka consumers
        asyncio.create_task(start_kafka_workers())
        print("✅ Kafka workers started")
        
        # Start periodic database ingestion
        asyncio.create_task(start_periodic_ingestion())
        print("✅ Periodic ingestion started")
    except Exception as e:
        print(f"⚠️  Kafka not available (optional): {e}")
        print("ℹ️  AI Agent will work without Kafka integration")
    
    # Start price watch monitor
    asyncio.create_task(start_watch_monitor())
    print("✅ Price watch monitor started")
    
    # Start hot deal monitor
    asyncio.create_task(start_hot_deal_monitor())
    print("✅ Hot deal monitor started")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Agent Service...")
    await kafka_service.shutdown()

app = FastAPI(
    title="Kayak AI Agent",
    description="AI-powered deals detection and travel concierge with OpenAI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
deal_detector = DealDetector()
intent_parser = IntentParser()
trip_planner = TripPlannerAgent()
explanation_engine = ExplanationEngine()

# ==================== HEALTH & INFO ====================

@app.get("/")
def root():
    return {
        "service": "Kayak AI Agent",
        "version": config.VERSION,
        "status": "running",
        "features": ["deals-detection", "ai-concierge", "trip-planning", "price-watches"]
    }

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "ai-agent"}

@app.get("/api/ai/metrics")
def get_performance_metrics():
    """Get performance metrics for database, cache, and overall system"""
    db_health = check_db_health()
    cache_stats = ai_cache.get_stats()
    db_stats = DBMetrics.get_stats()
    cache_metrics = CacheMetrics.get_stats()
    
    return {
        "service": "ai-agent",
        "database": {
            "status": db_health.get("status"),
            "deals_count": db_health.get("deals_count", 0),
            "trips_count": db_health.get("trips_count", 0),
            "watches_count": db_health.get("watches_count", 0),
            "queries": {
                "total": db_stats["total_queries"],
                "avg_time_ms": round(db_stats["avg_query_time"] * 1000, 2),
                "slow_queries": db_stats["slow_queries_count"]
            }
        },
        "cache": {
            "connected": cache_stats.get("redis_connected", False),
            "hits": cache_metrics["hits"],
            "misses": cache_metrics["misses"],
            "hit_rate": round(cache_metrics["hit_rate"] * 100, 2),
            "intent_keys": cache_stats.get("intent_keys", 0),
            "policy_keys": cache_stats.get("policy_keys", 0),
            "trip_keys": cache_stats.get("trip_keys", 0)
        },
        "performance": {
            "total_db_time_s": round(db_stats["total_time"], 2),
            "cache_efficiency": f"{round(cache_metrics['hit_rate'] * 100, 1)}%"
        }
    }

@app.post("/api/ai/cache/clear")
async def clear_cache():
    """Clear all AI caches"""
    try:
        # Clear intent parsing cache
        ai_cache.clear_prefix("intent")
        ai_cache.clear_prefix("policy")
        ai_cache.clear_prefix("trip")
        ai_cache.clear_prefix("explanation")
        return {"status": "success", "message": "All AI caches cleared"}
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DEALS ENDPOINTS ====================

@app.get("/api/ai/deals", response_model=List[DealSchema])
async def get_deals(
    limit: int = Query(10, ge=1, le=100),
    deal_type: str = Query(None, regex="^(flight|hotel|all)$"),
    min_score: int = Query(0, ge=0, le=100),
    origin: str = Query(None, min_length=2, max_length=10),
    destination: str = Query(None, min_length=2, max_length=10)
):
    """Get current active deals with optional filtering by origin/destination"""
    session = get_session()
    
    # Build base queries
    if deal_type == "all" or not deal_type:
        flights_query = session.query(Deal).filter(Deal.active == True, Deal.type == 'flight')
        hotels_query = session.query(Deal).filter(Deal.active == True, Deal.type == 'hotel')
        
        if min_score > 0:
            flights_query = flights_query.filter(Deal.score >= min_score)
            hotels_query = hotels_query.filter(Deal.score >= min_score)
        
        # Get more than needed for filtering (fetch more to ensure we have matches after filtering)
        flights = flights_query.order_by(Deal.score.desc()).limit(limit * 10).all()
        hotels = hotels_query.order_by(Deal.score.desc()).limit(limit * 10).all()
        
        # Map airport codes to city names for hotel filtering
        airport_to_city = {
            'LAX': 'LOS ANGELES',
            'SFO': 'SAN FRANCISCO',
            'JFK': 'NEW YORK',
            'LGA': 'NEW YORK',
            'EWR': 'NEW YORK',
            'ORD': 'CHICAGO',
            'MIA': 'MIAMI',
            'BOS': 'BOSTON',
            'SEA': 'SEATTLE',
            'DEN': 'DENVER',
            'ATL': 'ATLANTA',
            'LAS': 'LAS VEGAS'
        }
        
        # Filter in Python by origin/destination
        if origin:
            flights = [f for f in flights if f.get_metadata().get('origin', '').upper() == origin.upper()]
        if destination:
            flights = [f for f in flights if f.get_metadata().get('destination', '').upper() == destination.upper()]
            # For hotels, search by city name (convert airport code if needed)
            search_city = airport_to_city.get(destination.upper(), destination.upper())
            hotels = [h for h in hotels if search_city in h.get_metadata().get('city', '').upper()]
        
        # Determine split based on filters
        if origin and destination:
            # Both filters - prioritize flights
            flights = flights[:limit]
            hotels = hotels[:max(0, limit - len(flights))]
        elif origin:
            # Only origin filter - flights only make sense
            flights = flights[:limit]
            hotels = []
        elif destination:
            # Only destination filter - could be hotel search, show balanced mix
            flights = flights[:limit // 2]
            hotels = hotels[:limit // 2]
        else:
            # No filters - balanced mix
            flights = flights[:limit // 2]
            hotels = hotels[:limit // 2]
        
        deals = flights + hotels
    else:
        # For specific type requests
        query = session.query(Deal).filter(Deal.active == True, Deal.type == deal_type)
        
        if min_score > 0:
            query = query.filter(Deal.score >= min_score)
        
        # Get more results for filtering
        all_deals = query.order_by(Deal.score.desc()).limit(limit * 2).all()
        
        # Filter in Python
        if deal_type == 'flight' or not deal_type:
            if origin:
                all_deals = [d for d in all_deals if d.get_metadata().get('origin', '').upper() == origin.upper()]
            if destination:
                all_deals = [d for d in all_deals if d.get_metadata().get('destination', '').upper() == destination.upper()]
        elif deal_type == 'hotel' and destination:
            all_deals = [d for d in all_deals if destination.upper() in d.get_metadata().get('city', '').upper()]
        
        deals = all_deals[:limit]
    
    result = [
        DealSchema(
            deal_id=d.deal_id,
            type=d.type,
            title=d.title,
            description=d.description,
            price=d.price,
            original_price=d.original_price,
            discount_percent=d.discount_percent,
            score=d.score,
            tags=d.get_tags(),
            metadata=d.get_metadata(),
            expires_at=d.expires_at,
            created_at=d.created_at
        )
        for d in deals
    ]
    
    session.close()
    return result

@app.get("/api/ai/deals/{deal_id}")
async def get_deal(deal_id: str):
    """Get specific deal details"""
    session = get_session()
    deal = session.query(Deal).filter(Deal.deal_id == deal_id).first()
    
    if not deal:
        session.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    
    result = DealSchema(
        deal_id=deal.deal_id,
        type=deal.type,
        title=deal.title,
        description=deal.description,
        price=deal.price,
        original_price=deal.original_price,
        discount_percent=deal.discount_percent,
        score=deal.score,
        tags=deal.get_tags(),
        metadata=deal.get_metadata(),
        expires_at=deal.expires_at,
        created_at=deal.created_at
    )
    
    session.close()
    return result

@app.get("/api/ai/deals/{deal_id}/explain")
async def explain_deal(deal_id: str):
    """Generate AI explanation for why a deal is good"""
    session = get_session()
    deal = session.query(Deal).filter(Deal.deal_id == deal_id).first()
    
    if not deal:
        session.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check cache first
    cache_key = f"explanation:{deal_id}"
    cached_explanation = ai_cache.redis_client.get(cache_key) if ai_cache.redis_client else None
    
    if cached_explanation:
        session.close()
        return {"deal_id": deal_id, "explanation": cached_explanation}
    
    # Generate explanation
    metadata = deal.get_metadata()
    explanation_parts = []
    
    # Price comparison
    if deal.discount_percent > 50:
        explanation_parts.append(f"🔥 **Amazing {deal.discount_percent:.0f}% discount** - You're saving ${deal.original_price - deal.price:.0f}!")
    elif deal.discount_percent > 30:
        explanation_parts.append(f"💰 **Great {deal.discount_percent:.0f}% savings** - ${deal.original_price - deal.price:.0f} off!")
    elif deal.discount_percent > 0:
        explanation_parts.append(f"✨ **{deal.discount_percent:.0f}% discount** - Save ${deal.original_price - deal.price:.0f}")
    
    # Price vs 30-day average
    price_vs_avg = metadata.get('price_vs_30d_avg', 0)
    if price_vs_avg > 40:
        explanation_parts.append(f"📊 **{price_vs_avg:.0f}% below 30-day average** - Best price in a month!")
    elif price_vs_avg > 20:
        explanation_parts.append(f"📉 **{price_vs_avg:.0f}% below recent average** - Good timing!")
    elif price_vs_avg < -20:
        explanation_parts.append(f"⚠️ Price is {abs(price_vs_avg):.0f}% above average - Consider waiting")
    
    # Deal-specific insights
    if deal.type == 'flight':
        stops = metadata.get('stops', 0)
        if stops == 0:
            explanation_parts.append("✈️ **Direct flight** - No layovers, fastest route")
        elif stops == 1:
            explanation_parts.append("🔄 **1 stop** - Good balance of price and travel time")
        
        seats = metadata.get('seats_left')
        if seats and seats < 5:
            explanation_parts.append(f"⏰ **Only {seats} seats left** - Book soon!")
        elif seats and seats < 10:
            explanation_parts.append(f"⚡ **{seats} seats remaining** - Popular flight")
    
    elif deal.type == 'hotel':
        room_type = metadata.get('room_type', '')
        if 'entire home' in room_type.lower():
            explanation_parts.append("🏠 **Entire home/apt** - Complete privacy and space")
        elif 'private room' in room_type.lower():
            explanation_parts.append("🚪 **Private room** - Your own space with shared amenities")
        
        amenities = metadata.get('amenities', [])
        if amenities:
            top_amenities = amenities[:3]
            explanation_parts.append(f"🎯 **Amenities:** {', '.join(top_amenities)}")
        
        availability = metadata.get('availability_365')
        if availability and availability < 30:
            explanation_parts.append(f"⏳ **High demand** - Only available {availability} days/year")
    
    # Score explanation
    if deal.score >= 90:
        explanation_parts.append(f"⭐ **Score: {deal.score}/100** - Excellent value, highly recommended!")
    elif deal.score >= 70:
        explanation_parts.append(f"👍 **Score: {deal.score}/100** - Good deal, solid choice")
    
    explanation = "\n\n".join(explanation_parts)
    
    # Cache the explanation
    if ai_cache.redis_client:
        ai_cache.redis_client.setex(cache_key, 3600, explanation)  # Cache for 1 hour
    
    session.close()
    return {"deal_id": deal_id, "explanation": explanation, "score": deal.score, "discount_percent": deal.discount_percent}

# ==================== USER PREFERENCES ENDPOINTS ====================

@app.get("/api/ai/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    """Get user preferences"""
    session = get_session()
    
    # Try to find existing preferences
    pref = session.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if not pref:
        # Return default preferences
        session.close()
        return {
            "user_id": user_id,
            "preferences": {
                "budget_max": None,
                "preferred_airlines": [],
                "preferred_hotel_types": [],
                "direct_flights_only": False,
                "time_preference": None,  # "morning", "afternoon", "evening"
                "frequent_routes": [],
                "favorite_destinations": [],
                "travel_class": "economy"
            },
            "search_count": 0
        }
    
    session.close()
    return {
        "user_id": pref.user_id,
        "preferences": pref.get_preferences(),
        "search_count": pref.search_count,
        "updated_at": pref.updated_at.isoformat()
    }

@app.post("/api/ai/preferences/{user_id}")
async def update_user_preferences(user_id: str, preferences: dict):
    """Update user preferences"""
    session = get_session()
    
    # Try to find existing preferences
    pref = session.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if not pref:
        # Create new preferences
        pref = UserPreference(user_id=user_id)
        session.add(pref)
    
    # Update preferences
    pref.set_preferences(preferences)
    pref.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(pref)
    
    result = {
        "user_id": pref.user_id,
        "preferences": pref.get_preferences(),
        "search_count": pref.search_count,
        "updated_at": pref.updated_at.isoformat()
    }
    
    session.close()
    return result

@app.post("/api/ai/compare")
async def compare_deals_endpoint(deal_ids: List[str]):
    """Compare multiple deals side-by-side"""
    if len(deal_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 deals to compare")
    if len(deal_ids) > 5:
        raise HTTPException(status_code=400, detail="Can only compare up to 5 deals at once")
    
    session = get_session()
    deals_data = []
    
    for deal_id in deal_ids:
        deal = session.query(Deal).filter(Deal.deal_id == deal_id).first()
        if not deal:
            continue
        
        metadata = deal.get_metadata()
        deals_data.append({
            "deal_id": deal.deal_id,
            "title": deal.title,
            "type": deal.type,
            "price": deal.price,
            "original_price": deal.original_price,
            "discount_percent": deal.discount_percent,
            "score": deal.score,
            "metadata": metadata
        })
    
    session.close()
    
    if len(deals_data) < 2:
        raise HTTPException(status_code=404, detail="Could not find enough deals to compare")
    
    # Generate AI comparison
    comparison = await compare_deals(deals_data)
    
    return {
        "deals": deals_data,
        "comparison": comparison,
        "count": len(deals_data)
    }

# ==================== PREFERENCE LEARNING HELPERS ====================

def learn_from_search(user_id: str, intent: str, entities: dict):
    """Learn user preferences from their searches"""
    session = get_session()
    
    # Get or create user preferences
    pref = session.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not pref:
        pref = UserPreference(user_id=user_id)
        pref.set_preferences({
            "budget_max": None,
            "preferred_airlines": [],
            "preferred_hotel_types": [],
            "direct_flights_only": False,
            "time_preference": None,
            "frequent_routes": [],
            "favorite_destinations": [],
            "travel_class": "economy"
        })
        session.add(pref)
    
    prefs = pref.get_preferences()
    pref.search_count += 1
    
    # Learn from budget patterns
    if entities.get('budget'):
        budget = entities['budget']
        if not prefs.get('budget_max') or budget < prefs['budget_max']:
            prefs['budget_max'] = budget
    
    # Learn frequent routes
    if entities.get('origin') and entities.get('destination'):
        route = f"{entities['origin']}-{entities['destination']}"
        if 'frequent_routes' not in prefs:
            prefs['frequent_routes'] = []
        if route not in prefs['frequent_routes']:
            prefs['frequent_routes'].append(route)
        # Keep only top 10 routes
        prefs['frequent_routes'] = prefs['frequent_routes'][-10:]
    
    # Learn favorite destinations
    if entities.get('destination'):
        dest = entities['destination']
        if 'favorite_destinations' not in prefs:
            prefs['favorite_destinations'] = []
        if dest not in prefs['favorite_destinations']:
            prefs['favorite_destinations'].append(dest)
        # Keep only top 10 destinations
        prefs['favorite_destinations'] = prefs['favorite_destinations'][-10:]
    
    pref.set_preferences(prefs)
    pref.updated_at = datetime.utcnow()
    session.commit()
    session.close()

# ==================== AI CONCIERGE ENDPOINTS ====================

@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(query: UserQuery):
    """Process natural language query with AI"""
    
    # Check for refinement queries (e.g., "show me cheaper options", "direct flights only")
    message_lower = query.message.lower()
    is_refinement = any(word in message_lower for word in [
        'cheaper', 'more expensive', 'under', 'less than', 'direct', 'non-stop', 'nonstop',
        'different', 'another', 'alternative', 'other options', 'better', 'worse',
        'earlier', 'later', 'morning', 'evening', 'afternoon', 'night',
        'longer stay', 'shorter stay', 'more days', 'fewer days'
    ])
    
    # Check for date flexibility queries
    is_flexible_dates = any(phrase in message_lower for phrase in [
        'flexible', 'cheapest dates', 'best dates', 'any dates', 'when is cheapest',
        'cheapest time', 'best time to fly', 'anytime in', 'any time in'
    ])
    
    # Get conversation context if this is a refinement
    conversation_context = None
    if is_refinement:
        conversation_context = ai_cache.get_conversation_context(query.user_id)
        print(f"🔄 Refinement detected! Context: {conversation_context}")
        
        # Apply refinement logic if we have context
        if conversation_context:
            last_entities = conversation_context.get('last_entities', {})
            
            # Extract refinement constraints
            if 'cheaper' in message_lower or 'under' in message_lower or 'less than' in message_lower:
                # Extract budget if mentioned, otherwise reduce by 20%
                budget_match = re.search(r'\$?(\d+)', query.message)
                if budget_match:
                    last_entities['budget'] = float(budget_match.group(1))
                elif last_entities.get('budget'):
                    last_entities['budget'] = last_entities['budget'] * 0.8
                query.message = f"Find deals with budget ${last_entities.get('budget', 500):.0f}"
            
            elif 'direct' in message_lower or 'non-stop' in message_lower or 'nonstop' in message_lower:
                last_entities['direct_only'] = True
                query.message = "Show direct flights only"
            
            elif 'morning' in message_lower:
                last_entities['time_preference'] = 'morning'
            elif 'evening' in message_lower or 'night' in message_lower:
                last_entities['time_preference'] = 'evening'
            elif 'afternoon' in message_lower:
                last_entities['time_preference'] = 'afternoon'
            
            # Preserve previous entities if not overridden
            if last_entities.get('origin') and 'origin' not in query.message.lower():
                query.message = f"from {last_entities['origin']} {query.message}"
            if last_entities.get('destination') and 'destination' not in query.message.lower() and 'to' not in query.message.lower():
                query.message = f"{query.message} to {last_entities['destination']}"
            
            print(f"🔄 Refined query: {query.message}")
    
    # City to airport code mapping
    CITY_TO_AIRPORT = {
        'SAN FRANCISCO': 'SFO', 'SF': 'SFO', 'LOS ANGELES': 'LAX', 'LA': 'LAX',
        'NEW YORK': 'JFK', 'NYC': 'JFK', 'MIAMI': 'MIA', 'CHICAGO': 'ORD',
        'BOSTON': 'BOS', 'SEATTLE': 'SEA', 'LAS VEGAS': 'LAS', 'VEGAS': 'LAS',
        'DENVER': 'DEN', 'ATLANTA': 'ATL', 'DALLAS': 'DFW', 'PHILADELPHIA': 'PHL',
        'LONDON': 'LHR', 'PARIS': 'CDG', 'TOKYO': 'NRT', 'DUBAI': 'DXB',
        'SINGAPORE': 'SIN', 'SYDNEY': 'SYD', 'BANGKOK': 'BKK', 'HONG KONG': 'HKG',
        'BARCELONA': 'BCN', 'ROME': 'FCO', 'AMSTERDAM': 'AMS', 'FRANKFURT': 'FRA',
        'MEXICO CITY': 'MEX', 'TORONTO': 'YYZ', 'MONTREAL': 'YUL',
    }
    
    def normalize_airport_code(location: str) -> str:
        """Convert city name to airport code if needed"""
        if not location:
            return location
        location_upper = location.upper().strip()
        # If already 3-letter code, return as-is
        if len(location_upper) == 3 and location_upper.isalpha():
            return location_upper
        # Try to map city to airport
        return CITY_TO_AIRPORT.get(location_upper, location_upper)
    
    # Try to get cached intent parsing result first
    cached_result = ai_cache.get_intent_parsing(query.message)
    if cached_result:
        print(f"✅ Cache HIT for intent parsing: {query.message[:50]}...")
        result = cached_result
    else:
        print(f"❌ Cache MISS for intent parsing: {query.message[:50]}...")
        # Parse intent using OpenAI (with fallback)
        result = await intent_parser.parse(query.user_id, query.message, query.conversation_history)
        # Cache the result
        ai_cache.set_intent_parsing(query.message, result)
    
    intent = result.get('intent', 'unknown')
    entities = result.get('entities', {})
    confidence = result.get('confidence', 0.0)
    
    # Normalize airport codes
    if entities.get('origin'):
        entities['origin'] = normalize_airport_code(entities['origin'])
    if entities.get('destination'):
        entities['destination'] = normalize_airport_code(entities['destination'])
    
    # Check if we have enough info to perform a search
    has_origin = entities.get('origin')
    has_destination = entities.get('destination')
    has_start_date = entities.get('start_date')
    has_end_date = entities.get('end_date')
    has_dates = has_start_date and has_end_date
    has_budget = entities.get('budget')
    
    # Debug logging
    print(f"🔍 Intent: {intent}, Confidence: {confidence}")
    print(f"📍 Entities extracted: {entities}")
    print(f"✓ has_origin: {has_origin}, has_destination: {has_destination}, has_dates: {has_dates}, has_budget: {has_budget}")
    
    # Detect multi-city trips (e.g., "JFK to Paris to London to JFK")
    message_upper = query.message.upper()
    is_multi_city = False
    cities = []
    
    # Look for patterns with "to" between multiple cities/airports
    parts = re.split(r'\s+TO\s+', message_upper)
    if len(parts) >= 3:  # At least 3 cities (origin + 2 destinations)
        is_multi_city = True
        for part in parts:
            # Extract city/airport code
            words = part.strip().split()
            # First try to find a 3-letter airport code
            found = False
            for word in words:
                if len(word) == 3 and word.isalpha():
                    cities.append(normalize_airport_code(word))
                    found = True
                    break
            # If no 3-letter code found, try to map city name
            if not found and words:
                city_name = words[0] if words else part.strip()
                airport_code = normalize_airport_code(city_name)
                cities.append(airport_code)
        print(f"🌍 Multi-city trip detected: {cities}")
    
    # Handle multi-city trips
    if is_multi_city and len(cities) >= 3:
        response_text = f"🌍 **Multi-City Trip: {' → '.join(cities)}**\n\n"
        response_text += f"I found your {len(cities)}-city itinerary! Here's what I can do:\n\n"
        
        # Calculate legs
        legs = []
        total_estimated_cost = 0
        for i in range(len(cities) - 1):
            leg = f"{cities[i]} → {cities[i+1]}"
            legs.append(leg)
            # Estimate cost per leg (rough estimate)
            total_estimated_cost += 400  # Average flight cost
        
        response_text += "✈️ **Flight Legs:**\n"
        for i, leg in enumerate(legs, 1):
            response_text += f"   {i}. {leg}\n"
        
        response_text += f"\n💰 **Estimated Total:** ~${total_estimated_cost}\n"
        response_text += f"\n📊 **What's Next:**\n"
        response_text += "• I'm searching for the best prices for each leg\n"
        response_text += "• You can see individual flights in the sidebar\n"
        response_text += "• Tell me your dates for exact pricing\n"
        response_text += "• I'll help you find connections that work!\n"
        
        # Store the cities in entities for potential use
        entities['cities'] = cities
        entities['origin'] = cities[0]
        entities['destination'] = cities[-1]
        
        return ChatResponse(
            response=response_text,
            intent=intent,
            entities=entities,
            confidence=confidence,
            deals=[],
            plans=[]
        )
    
    # Handle flexible dates
    if is_flexible_dates and has_destination:
        response_text = f"📅 **Flexible Dates Search for {entities.get('destination')}**\n\n"
        response_text += "Great! I'll find you the cheapest dates to travel.\n\n"
        response_text += "💡 **Here's my strategy:**\n"
        response_text += "• I'm checking prices across multiple weeks\n"
        response_text += "• Looking for mid-week departures (usually cheaper)\n"
        response_text += "• Avoiding peak travel times\n"
        response_text += "• Finding deals with flexible stay durations\n\n"
        response_text += "📊 **Check the sidebar** for the best deals I found!\n"
        response_text += "💬 **Next:** Tell me specific dates once you decide, and I'll track them for you!"
        
        # Still fetch deals but don't filter by specific dates
        entities.pop('start_date', None)
        entities.pop('end_date', None)
    
    # Generate response based on intent
    response_text = ""
    plans = None
    
    # Auto-upgrade to plan_trip if we have budget + destination (even if intent is just "search")
    if has_budget and has_destination and (intent == 'search' or intent == 'plan_trip'):
        intent = 'plan_trip'  # Upgrade the intent
    
    # Detect comparison requests
    if any(phrase in message_lower for phrase in ['compare', 'comparison', 'which is better', 'vs', 'versus']):
        # Check if comparing deals
        if 'deal' in message_lower or 'flight' in message_lower or 'hotel' in message_lower:
            response_text = "📊 **Deal Comparison**\n\n"
            response_text += "To compare deals, I need you to:\n"
            response_text += "1. Select 2-5 deals you're interested in\n"
            response_text += "2. Click the 'Compare' button (coming soon!)\n"
            response_text += "3. Or tell me: 'Compare deal ABC with deal XYZ'\n\n"
            response_text += "💡 **I'll show you:**\n"
            response_text += "• Side-by-side price comparison\n"
            response_text += "• Key differences in features\n"
            response_text += "• Which offers better value\n"
            response_text += "• Personalized recommendations\n"
            
            return ChatResponse(
                response=response_text,
                intent='compare',
                entities=entities,
                confidence=0.9,
                deals=[],
                plans=[]
            )
    
    # Detect policy questions even if intent was misclassified
    question_lower = query.message.lower()
    if any(word in question_lower for word in ['cancel', 'refund', 'baggage', 'bag', 'policy', 'fee', 
                                                 'change flight', 'change hotel', '24 hour', 'insurance',
                                                 'pet', 'parking', 'breakfast', 'amenity', 'check-in', 'check-out']):
        intent = 'question'  # Override to question intent
    
    # If we have enough info for trip planning, perform the search (dates optional)
    if intent == 'plan_trip' and has_destination:
        # Learn from this search
        learn_from_search(query.user_id, intent, entities)
        
        try:
            # Safely convert passengers/party_size to int
            passengers = entities.get('passengers') or entities.get('party_size', 1)
            try:
                party_size = int(passengers) if passengers else 1
            except (ValueError, TypeError):
                party_size = 1
            
            user_context = {
                'user_id': query.user_id,
                'origin': entities.get('origin'),
                'destination': entities.get('destination'),
                'start_date': entities.get('start_date'),
                'end_date': entities.get('end_date'),
                'budget': entities.get('budget', 5000),
                'party_size': party_size,
                'preferences': entities.get('preferences', [])
            }
            
            # Check cache for trip plans first
            cached_plans = ai_cache.get_trip_plan(user_context)
            if cached_plans:
                print(f"✅ Cache HIT for trip plan: {user_context['destination']}")
                plans = cached_plans
            else:
                print(f"❌ Cache MISS for trip plan: {user_context['destination']}")
                plans = await trip_planner.plan_trip(user_context)
                if plans:
                    ai_cache.set_trip_plan(user_context, plans)
            
            if plans:
                best_plan = plans[0]
                total_cost = best_plan.get('total_cost', 0)
                flight = best_plan.get('flight', {})
                hotel = best_plan.get('hotel', {})
                fit_score = best_plan.get('fit_score', 0)
                
                dest_text = entities.get('destination')
                
                response_text = f"✨ **Perfect! I found {len(plans)} trip package(s) to {dest_text}!**\n\n"
                response_text += f"🏆 **BEST MATCH** (Score: {fit_score:.0f}/100)\n"
                response_text += f"💰 **Total Package Price: ${total_cost:.0f}**\n\n"
                
                # Flight details
                flight_savings = ((flight.get('original_price', flight.get('price', 0)) - flight.get('price', 0)) / flight.get('original_price', 1) * 100) if flight.get('original_price') else 0
                response_text += f"✈️ **Flight:**\n"
                response_text += f"   • {flight.get('title', 'Available flight')}\n"
                response_text += f"   • ${flight.get('price', 0):.0f}"
                if flight_savings > 0:
                    response_text += f" (Save {flight_savings:.0f}%)\n"
                else:
                    response_text += "\n"
                
                # Hotel details
                response_text += f"\n🏨 **Hotel:**\n"
                response_text += f"   • {hotel.get('title', 'Available hotel')}\n"
                response_text += f"   • ${hotel.get('price_per_night', 0):.0f}/night\n"
                
                response_text += f"\n📊 **Package includes {len(plans)} option(s)** - see all in the deals sidebar!\n"
                response_text += f"\n💡 **AI Tips:** Ask me to 'explain this price' or 'track this deal' for alerts!"
            else:
                response_text = f"🔍 I searched for trip packages to {entities.get('destination')}, but couldn't find perfect matches within your budget right now.\n\n"
                response_text += f"💡 **Try:** Increasing your budget or check the sidebar for individual deals!"
        except Exception as e:
            print(f"Error planning trip: {e}")
            response_text = "I understand you want to plan a trip! Check the 'Top Deals' sidebar while I search for the best options."
    
    elif intent == 'search_flights' or intent == 'search':
        if has_destination:
            # Learn from this search
            learn_from_search(query.user_id, intent, entities)
            
            dest_name = entities.get('destination', 'your destination')
            # Fetch actual deals to show
            session = get_session()
            
            # Get all active flight deals and filter by destination in Python
            all_flights = session.query(Deal).filter(Deal.active == True, Deal.type == 'flight').all()
            
            # Filter by destination (and optionally origin) in metadata
            matching_flights = []
            for deal in all_flights:
                try:
                    metadata = json.loads(deal.deal_metadata) if deal.deal_metadata else {}
                    deal_dest = metadata.get('destination', '')
                    deal_origin = metadata.get('origin', '')
                    
                    # Check if destination matches
                    if deal_dest == entities.get('destination'):
                        # If origin specified, also check origin
                        if has_origin:
                            if deal_origin == entities.get('origin'):
                                matching_flights.append(deal)
                        else:
                            matching_flights.append(deal)
                except json.JSONDecodeError:
                    continue
            
            # Sort by score and get top 3
            matching_flights.sort(key=lambda x: x.score, reverse=True)
            top_deals = matching_flights[:3]
            
            session.close()
            
            response_text = f"✈️ **Searching for flights to {dest_name}!**\n\n"
            if has_origin:
                response_text = f"✈️ **Flights from {entities.get('origin')} to {dest_name}**\n\n"
            
            if top_deals:
                response_text += "🔥 **Top Flight Deals:**\n"
                for i, deal in enumerate(top_deals[:3], 1):
                    savings = deal.discount_percent
                    response_text += f"{i}. {deal.title} - **${deal.price:.0f}** (Save {savings:.0f}%)\n"
                response_text += "\n💡 **AI Features:**\n"
                response_text += "• Click any deal for full details\n"
                response_text += "• Ask 'explain this price' for insights\n"
                response_text += "• Try 'track this deal' for alerts!\n"
            else:
                response_text += "I'm searching... Check the 'Top Deals' sidebar!\n"
            
            if not has_dates:
                response_text += "\n📅 **Pro tip:** Tell me your travel dates for better matches!"
            else:
                response_text += f"\n📅 Travel: {entities.get('start_date')}"
        else:
            response_text = "✈️ **Let's find your perfect flight!**\n\n" \
                           "Tell me:\n" \
                           "• 📍 From where?\n" \
                           "• 🎯 To where?\n" \
                           "• 📅 When?\n\n" \
                           "💡 **I can also:**\n" \
                           "• Explain prices\n" \
                           "• Bundle flights + hotels\n" \
                           "• Track price drops\n\n" \
                           "Check the sidebar for hot deals!"
    
    elif intent == 'search_hotels':
        if has_destination:
            # Learn from this search
            learn_from_search(query.user_id, intent, entities)
            
            # Query database for hotel deals
            session = get_session()
            
            dest = entities.get('destination', '').upper()
            dest_name = dest
            
            # Map airport codes to city names for hotel search
            airport_to_city = {
                'LAX': 'LOS ANGELES',
                'SFO': 'SAN FRANCISCO',
                'JFK': 'NEW YORK',
                'ORD': 'CHICAGO',
                'MIA': 'MIAMI',
                'BOS': 'BOSTON',
                'SEA': 'SEATTLE',
                'DEN': 'DENVER',
                'ATL': 'ATLANTA',
                'LAS': 'LAS VEGAS'
            }
            
            # Use full city name if airport code provided
            search_city = airport_to_city.get(dest, dest)
            
            # Query hotels
            all_hotels = session.query(Deal).filter(Deal.type == 'hotel').all()
            
            # Filter by destination - check deal_metadata for city or destination
            matching_hotels = []
            for deal in all_hotels:
                try:
                    metadata = deal.get_metadata()
                    city = metadata.get('city', '').upper()
                    neighbourhood = metadata.get('neighbourhood', '').upper()
                    
                    # Match by city name or neighbourhood
                    if search_city in city or dest in city or dest in neighbourhood:
                        matching_hotels.append(deal)
                except:
                    continue
            
            # Sort by score and get top 3
            matching_hotels.sort(key=lambda x: x.score, reverse=True)
            top_deals = matching_hotels[:3]
            
            session.close()
            
            response_text = f"🏨 **Searching for hotels in {dest_name}!**\n\n"
            
            if top_deals:
                response_text += "🔥 **Top Hotel Deals:**\n"
                for i, deal in enumerate(top_deals[:3], 1):
                    savings = deal.discount_percent
                    response_text += f"{i}. {deal.title} - **${deal.price:.0f}/night** (Save {savings:.0f}%)\n"
                response_text += "\n💡 **AI Features:**\n"
                response_text += "• Click any deal for full details\n"
                response_text += "• Ask 'explain this price' for insights\n"
                response_text += "• Try 'track this deal' for alerts!\n"
            else:
                response_text += "I'm searching... Check the 'Top Deals' sidebar!\n"
            
            if not has_dates:
                response_text += "\n📅 **Pro tip:** Tell me your check-in/check-out dates for better matches!"
            else:
                response_text += f"\n📅 Check-in: {entities.get('start_date')}"
        else:
            response_text = "I'd love to help you find the perfect hotel! Please tell me:\n\n" \
                           "• Which city?\n" \
                           "• Check-in and check-out dates?\n" \
                           "• Number of guests?\n\n" \
                           "Check the 'Top Deals' sidebar for our hottest hotel deals!"
    
    elif intent == 'plan_trip':
        # If we have enough info, actually plan the trip!
        if has_destination and entities.get('budget'):
            try:
                user_context = {
                    'user_id': query.user_id,
                    'origin': entities.get('origin', 'SFO'),  # Default
                    'destination': entities.get('destination'),
                    'budget': entities.get('budget'),
                    'party_size': entities.get('party_size', 1),
                    'preferences': ['refundable', 'near-transit']
                }
                
                plans = await trip_planner.plan_trip(user_context)
                
                if plans:
                    best_plan = plans[0]
                    flight = best_plan.get('flight', {})
                    hotel = best_plan.get('hotel', {})
                    response_text = f"Perfect! I found great trip options for you:\n\n"
                    response_text += f"💰 Total: ${best_plan.get('total_cost', 0):.2f}\n"
                    response_text += f"⭐ Fit Score: {best_plan.get('fit_score', 0):.0f}/100\n\n"
                    response_text += f"✈️ Flight: {flight.get('title', 'Available')} - ${flight.get('price', 0):.0f}\n"
                    response_text += f"🏨 Hotel: {hotel.get('title', 'Available')} - ${hotel.get('price_per_night', 0):.0f}/night\n\n"
                    response_text += "Check the Top Deals sidebar to book!"
                else:
                    response_text = f"I searched for trips to {entities.get('destination')} within ${entities.get('budget')}, but couldn't find perfect matches. Check the 'Top Deals' sidebar for available options!"
            except Exception as e:
                print(f"Error planning trip: {e}")
                response_text = "Let me help plan your trip! Check the 'Top Deals' sidebar for current deals."
        else:
            response_text = "Exciting! Let's plan your trip. I need:\n\n" \
                           "• Where do you want to go?\n" \
                           "• Your budget?\n" \
                           "• How many people?\n\n" \
                           "I'll find you the best flight + hotel bundles!"
    
    elif intent == 'find_deals':
        # Get actual stats
        session = get_session()
        total_deals = session.query(Deal).filter(Deal.active == True).count()
        hot_deals = session.query(Deal).filter(Deal.active == True, Deal.score >= 90).count()
        session.close()
        
        response_text = f"🔥 **I'm tracking {total_deals:,} active deals!**\n\n"
        response_text += f"⚡ **{hot_deals} HOT DEALS** with 50%+ savings\n\n"
        response_text += "✨ **AI Features:**\n"
        response_text += "• 📊 'Explain why this price is good'\n"
        response_text += "• 🎯 'Find flights to Miami under $300'\n"
        response_text += "• 💼 'Plan a trip to Paris for $2000'\n"
        response_text += "• 🔔 'Track this deal' for price alerts\n\n"
        response_text += "👉 **Check the sidebar** for top deals →"
    
    elif intent == 'general_inquiry' or intent == 'policy_question' or intent == 'question':
        # Handle policy and general questions
        try:
            # Check cache first
            cached_answer = ai_cache.get_policy_answer(query.message)
            if cached_answer:
                print(f"✅ Cache HIT for policy Q&A: {query.message[:50]}...")
                response_text = cached_answer
            else:
                print(f"❌ Cache MISS for policy Q&A: {query.message[:50]}...")
                answer = await answer_policy_question(query.message)
                response_text = answer
                # Cache the answer
                ai_cache.set_policy_answer(query.message, answer)
        except Exception as e:
            print(f"Error answering policy question: {e}")
            # Smart fallback
            if any(word in question_lower for word in ['cancel', 'refund']):
                response_text = "Most airlines allow free cancellation within 24 hours of booking. For specific cancellation policies, check the deal details in the Top Deals sidebar."
            elif any(word in question_lower for word in ['baggage', 'bag', 'luggage']):
                response_text = "Baggage fees vary by airline. Southwest offers 2 free checked bags. Most others charge $30-35 for the first bag. Check your specific flight details for exact fees."
            elif any(word in question_lower for word in ['change', 'modify']):
                response_text = "Most major airlines have eliminated change fees for domestic flights. You only pay the fare difference. Basic Economy tickets typically cannot be changed."
            else:
                response_text = "I can help answer questions about cancellations, baggage fees, change policies, and more. What would you like to know?"
    
    # Smart fallback: If we have origin/destination, treat as flight search even if intent unclear
    elif has_origin and has_destination:
        response_text = f"Looking for flights from {entities.get('origin')} to {entities.get('destination')}! "
        if has_dates:
            response_text += f"I see you want to travel around {entities.get('start_date')}. "
        response_text += "Check the 'Top Deals' sidebar for current flight offers!"
    elif has_destination:
        response_text = f"Looking for travel options to {entities.get('destination')}! Check the 'Top Deals' sidebar for flights and hotels. Let me know your travel dates for personalized results!"
    else:
        # Get stats for engaging greeting
        session = get_session()
        hot_deal_count = session.query(Deal).filter(Deal.active == True, Deal.score >= 90).count()
        session.close()
        
        response_text = f"👋 **Hi! I'm your AI-powered travel assistant!**\n\n"
        response_text += f"Right now tracking **{hot_deal_count} HOT DEALS** with amazing savings!\n\n"
        response_text += "🤖 **My AI Superpowers:**\n"
        response_text += "✈️ **Smart Search** - 'Find cheap flights to Miami'\n"
        response_text += "🏨 **Hotel Deals** - 'Hotels in NYC under $200'\n"
        response_text += "🎒 **Trip Planning** - 'Plan a trip to Paris for 2 people'\n"
        response_text += "📊 **Price Analysis** - 'Why is this flight expensive?'\n"
        response_text += "🔔 **Price Tracking** - 'Alert me when prices drop'\n"
        response_text += "❓ **Policy Q&A** - 'What's your cancellation policy?'\n\n"
        response_text += "💡 **Try:** 'from JFK to LAX on December 20th'"
    
    # Store conversation context for future refinements
    if entities or plans:
        context_to_store = {
            'last_intent': intent,
            'last_entities': entities,
            'last_message': query.message,
            'timestamp': datetime.now().isoformat()
        }
        if plans:
            context_to_store['last_plans'] = plans
        ai_cache.set_conversation_context(query.user_id, context_to_store)
    
    return ChatResponse(
        response=response_text,
        intent=intent,
        entities=entities,
        confidence=confidence,
        plans=plans
    )

@app.post("/api/ai/trip/plan", response_model=TripPlanResponse)
async def plan_trip_endpoint(request: TripPlanRequest):
    """
    Plan a complete trip with flights and hotels
    Sends real-time updates via WebSocket if user is connected
    """
    user_context = {
        'user_id': request.user_id,
        'origin': request.origin,
        'destination': request.destination,
        'start_date': request.start_date,
        'end_date': request.end_date,
        'budget': request.budget,
        'party_size': request.party_size,
        'preferences': request.preferences
    }
    
    # Notify user that planning has started (if connected)
    await ws_service.send_trip_update(
        request.user_id,
        "planning_started",
        {"message": "Searching for the best trip options...", "progress": 0}
    )
    
    # Search for plans
    await ws_service.send_trip_update(
        request.user_id,
        "searching",
        {"message": "Analyzing flights and hotels...", "progress": 30}
    )
    
    plans = await trip_planner.plan_trip(user_context)
    
    if not plans:
        await ws_service.send_trip_update(
            request.user_id,
            "failed",
            {"message": "No suitable trips found", "progress": 100}
        )
        raise HTTPException(status_code=404, detail="No suitable trips found")
    
    # Notify user of results found
    await ws_service.send_trip_update(
        request.user_id,
        "results_found",
        {"message": f"Found {len(plans)} trip options!", "progress": 60}
    )
    
    best_plan = plans[0]
    plan_id = str(uuid.uuid4())
    
    # Generate explanation using OpenAI
    await ws_service.send_trip_update(
        request.user_id,
        "generating_explanation",
        {"message": "Creating personalized recommendation...", "progress": 80}
    )
    
    explanation = await generate_explanation(
        deal={'type': 'bundle', **best_plan},
        context=user_context,
        max_words=config.EXPLANATION_MAX_WORDS
    )
    
    # Send final result
    await ws_service.send_trip_update(
        request.user_id,
        "completed",
        {
            "message": "Trip plan ready!",
            "progress": 100,
            "plan_id": plan_id,
            "total_cost": best_plan.get('total_cost', 0),
            "fit_score": best_plan.get('fit_score', 0)
        }
    )
    
    return TripPlanResponse(
        plan_id=plan_id,
        itinerary=best_plan,
        fit_score=best_plan.get('fit_score', 0),
        total_cost=best_plan.get('total_cost', 0),
        explanation=explanation,
        alternatives=plans[1:3] if len(plans) > 1 else []
    )

@app.post("/api/ai/trip/refine")
async def refine_trip(query: UserQuery):
    """Refine trip search with new constraints"""
    # Get conversation history
    history = intent_parser.get_conversation_history(query.user_id)
    
    # Refine using OpenAI
    result = await intent_parser.parse(query.user_id, query.message, history)
    
    return {"entities": result.get('entities'), "message": "Search refined"}

# ==================== EXPLANATIONS ====================

@app.post("/api/ai/explain")
async def explain_deal(request: dict):
    """
    Generate comprehensive explanation for a deal with price analysis
    
    Returns:
        - explanation: Natural language explanation with price insights
        - price_analysis: Historical price data and trends
        - recommendation: Booking recommendation
        - comparison: How it compares to similar deals
    """
    deal_id = request.get('deal_id')
    user_context = request.get('user_context', {})
    include_comparison = request.get('include_comparison', True)
    
    session = get_session()
    deal = session.query(Deal).filter(Deal.deal_id == deal_id).first()
    
    if not deal:
        session.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Convert deal to dict
    deal_dict = {
        'deal_id': deal.deal_id,
        'type': deal.type,
        'title': deal.title,
        'price': deal.price,
        'original_price': deal.original_price,
        'discount_percent': deal.discount_percent,
        'score': deal.score,
        'tags': deal.get_tags(),
        'metadata': deal.get_metadata()
    }
    
    # Get competitor deals for comparison
    competitors = []
    if include_comparison:
        # Find similar deals (same type, similar destination)
        query = session.query(Deal).filter(
            Deal.type == deal.type,
            Deal.active == True,
            Deal.deal_id != deal_id
        ).order_by(Deal.score.desc()).limit(3)
        
        competitors = [
            {
                'deal_id': d.deal_id,
                'title': d.title,
                'price': d.price,
                'score': d.score,
                'type': d.type
            }
            for d in query.all()
        ]
    
    session.close()
    
    # Generate comprehensive insights using explanation engine
    insights = generate_deal_insights(deal_dict, competitors)
    
    return {
        "deal_id": deal_id,
        "explanation": insights["explanation"],
        "price_analysis": insights["price_analysis"],
        "recommendation": insights["recommendation"],
        "comparison": insights.get("comparison", [])
    }
    
    return {
        'explanation': explanation,
        'watch_points': watch_alert,
        'deal_score': deal.score
    }

# ==================== POLICY Q&A ====================

@app.post("/api/ai/policy/question", response_model=PolicyAnswer)
async def ask_policy_question(question: PolicyQuestion):
    """Answer policy questions about a deal"""
    session = get_session()
    deal = session.query(Deal).filter(Deal.deal_id == question.deal_id).first()
    
    if not deal:
        session.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    
    metadata = deal.get_metadata()
    answer_text = await answer_policy_question(question.question, metadata)
    
    session.close()
    
    return PolicyAnswer(
        answer=answer_text,
        sources=["deal_metadata"]
    )

@app.post("/api/ai/policy")
async def general_policy_question(request: dict):
    """
    Answer general policy questions (may not need specific deal)
    """
    question = request.get('question', '')
    deal_id = request.get('deal_id')
    
    # If deal_id provided, get specific deal info
    if deal_id:
        session = get_session()
        deal = session.query(Deal).filter(Deal.deal_id == deal_id).first()
        
        if deal:
            metadata = deal.get_metadata()
            answer_text = await answer_policy_question(question, metadata)
            session.close()
            return {'answer': answer_text, 'sources': ['deal_metadata']}
        
        session.close()
    
    # General policy answer
    answer_text = await answer_policy_question(question, {})
    return {'answer': answer_text, 'sources': ['general_policy']}

# ==================== PRICE WATCHES ====================

@app.post("/api/ai/watch/create", response_model=PriceWatchResponse)
async def create_watch(request: PriceWatchRequest):
    """Create a price/inventory watch"""
    session = get_session()
    
    watch_id = str(uuid.uuid4())
    watch = PriceWatch(
        watch_id=watch_id,
        user_id=request.user_id,
        deal_id=request.deal_id,
        price_threshold=request.price_threshold,
        inventory_threshold=request.inventory_threshold,
        active=True
    )
    
    session.add(watch)
    session.commit()
    
    result = PriceWatchResponse(
        watch_id=watch.watch_id,
        deal_id=watch.deal_id,
        active=watch.active,
        created_at=watch.created_at
    )
    
    session.close()
    return result

@app.get("/api/ai/watch/list")
async def list_watches(user_id: str):
    """List all watches for a user"""
    session = get_session()
    watches = session.query(PriceWatch).filter(
        PriceWatch.user_id == user_id,
        PriceWatch.active == True
    ).all()
    
    result = [
        {
            "watch_id": w.watch_id,
            "deal_id": w.deal_id,
            "price_threshold": w.price_threshold,
            "inventory_threshold": w.inventory_threshold,
            "created_at": w.created_at
        }
        for w in watches
    ]
    
    session.close()
    return result

@app.delete("/api/ai/watch/{watch_id}")
async def delete_watch(watch_id: str):
    """Delete a price watch"""
    session = get_session()
    watch = session.query(PriceWatch).filter(PriceWatch.watch_id == watch_id).first()
    
    if not watch:
        session.close()
        raise HTTPException(status_code=404, detail="Watch not found")
    
    watch.active = False
    session.commit()
    session.close()
    
    return {"message": "Watch deleted", "watch_id": watch_id}

# ==================== WEBSOCKET ====================

@app.get("/api/websocket/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return ws_service.get_stats()

@app.get("/api/websocket/connections")
async def get_active_connections():
    """Get count of active WebSocket connections"""
    return {
        "active_connections": ws_service.get_connection_count(),
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket, user_id: str = Query(...)):
    """
    WebSocket endpoint for real-time updates
    Supports: deal alerts, price drops, trip updates, notifications
    """
    logger.info(f"WebSocket connection requested for user: {user_id}")
    await ws_service.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await ws_service.send_notification(user_id, 
            "Connected to Kayak AI - you'll receive real-time updates!", 
            "info"
        )
        
        while True:
            data = await websocket.receive_text()
            logger.info(f"WebSocket message from {user_id}: {data[:100]}")
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "ping":
                    # Heartbeat response
                    await ws_service.send_to_user(user_id, {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif message_type == "subscribe":
                    # Subscribe to specific channels (deals, prices, trips)
                    channel = message.get("channel")
                    if channel:
                        ws_service.add_user_to_room(user_id, channel)
                        await ws_service.send_notification(user_id, 
                            f"Subscribed to {channel} updates", 
                            "success"
                        )
                        
                elif message_type == "unsubscribe":
                    # Unsubscribe from channel
                    channel = message.get("channel")
                    if channel:
                        ws_service.remove_user_from_room(user_id, channel)
                        await ws_service.send_notification(user_id, 
                            f"Unsubscribed from {channel}", 
                            "info"
                        )
                        
                elif message_type == "get_stats":
                    # Send connection statistics
                    stats = ws_service.get_user_stats(user_id)
                    await ws_service.send_to_user(user_id, {
                        "type": "stats",
                        "data": stats
                    })
                    
                else:
                    # Echo unknown messages
                    await ws_service.send_to_user(user_id, {
                        "type": "ack", 
                        "message": "received",
                        "original_type": message_type
                    })
                    
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {user_id}: {data}")
                await ws_service.send_notification(user_id, 
                    "Invalid message format", 
                    "error"
                )
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user_id}")
        ws_service.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
        ws_service.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)

