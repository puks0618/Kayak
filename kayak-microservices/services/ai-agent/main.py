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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models and schemas
from models.schemas import (
    DealSchema, UserQuery, ChatResponse, TripPlanRequest, TripPlanResponse,
    PriceWatchRequest, PriceWatchResponse, PolicyQuestion, PolicyAnswer
)
from models.database import init_db, get_session, Deal, PriceWatch
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
        
        # Get more than needed for filtering
        flights = flights_query.order_by(Deal.score.desc()).limit(limit * 3).all()
        hotels = hotels_query.order_by(Deal.score.desc()).limit(limit * 3).all()
        
        # Filter in Python by origin/destination
        if origin:
            flights = [f for f in flights if f.get_metadata().get('origin', '').upper() == origin.upper()]
        if destination:
            flights = [f for f in flights if f.get_metadata().get('destination', '').upper() == destination.upper()]
            hotels = [h for h in hotels if destination.upper() in h.get_metadata().get('city', '').upper()]
        
        # If we have origin/destination filters, prioritize flights over hotels
        if origin or destination:
            # Return more flights when filtering by location
            flights = flights[:limit]
            hotels = hotels[:max(0, limit - len(flights))]
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

# ==================== AI CONCIERGE ENDPOINTS ====================

@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(query: UserQuery):
    """Process natural language query with AI"""
    
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
    
    # Generate response based on intent
    response_text = ""
    plans = None
    
    # Auto-upgrade to plan_trip if we have budget + destination (even if intent is just "search")
    if has_budget and has_destination and (intent == 'search' or intent == 'plan_trip'):
        intent = 'plan_trip'  # Upgrade the intent
    
    # Detect policy questions even if intent was misclassified
    question_lower = query.message.lower()
    if any(word in question_lower for word in ['cancel', 'refund', 'baggage', 'bag', 'policy', 'fee', 
                                                 'change flight', 'change hotel', '24 hour', 'insurance',
                                                 'pet', 'parking', 'breakfast', 'amenity', 'check-in', 'check-out']):
        intent = 'question'  # Override to question intent
    
    # If we have enough info for trip planning, perform the search (dates optional)
    if intent == 'plan_trip' and has_destination:
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
            dest_name = entities.get('destination', 'your destination')
            # Fetch actual deals to show
            session = get_session()
            deals_query = session.query(Deal).filter(Deal.active == True, Deal.type == 'flight')
            top_deals = deals_query.order_by(Deal.score.desc()).limit(3).all()
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
            response_text = f"Looking for hotels in {entities.get('destination')}! Check the 'Top Deals' sidebar for current hotel offers. Let me know your check-in/check-out dates for personalized results!"
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
                from services.openai_service import answer_policy_question
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

