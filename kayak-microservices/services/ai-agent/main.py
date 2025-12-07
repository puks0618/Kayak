"""
AI Agent Service Main Entry Point
FastAPI application for deals detection and AI concierge with OpenAI and Kafka
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import asyncio
import uuid

# Import models and schemas
from models.schemas import (
    DealSchema, UserQuery, ChatResponse, TripPlanRequest, TripPlanResponse,
    PriceWatchRequest, PriceWatchResponse, PolicyQuestion, PolicyAnswer
)
from models.database import init_db, get_session, Deal, PriceWatch

# Import services
from services.kafka_service import kafka_service, init_kafka
from services.websocket_service import ws_service
from services.openai_service import generate_explanation, answer_policy_question, compare_deals, generate_watch_alert

# Import agents
from agents.deal_detector import DealDetector
from agents.intent_parser import IntentParser
from agents.trip_planner import TripPlannerAgent
from config import config

# Import workers
from workers.kafka_workers import start_kafka_workers, start_periodic_ingestion
from workers.watch_monitor import start_watch_monitor

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting AI Agent Service...")
    init_db()
    print("✅ Database initialized")
    
    await init_kafka()
    print("✅ Kafka initialized")
    
    # Start background workers for Kafka consumers
    asyncio.create_task(start_kafka_workers())
    print("✅ Kafka workers started")
    
    # Start periodic database ingestion
    asyncio.create_task(start_periodic_ingestion())
    print("✅ Periodic ingestion started")
    
    # Start price watch monitor
    asyncio.create_task(start_watch_monitor())
    print("✅ Price watch monitor started")
    
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
        flights = flights_query.order_by(Deal.score.desc()).limit(limit * 2).all()
        hotels = hotels_query.order_by(Deal.score.desc()).limit(limit * 2).all()
        
        # Filter in Python by origin/destination
        if origin:
            flights = [f for f in flights if f.get_metadata().get('origin', '').upper() == origin.upper()]
        if destination:
            flights = [f for f in flights if f.get_metadata().get('destination', '').upper() == destination.upper()]
            hotels = [h for h in hotels if destination.upper() in h.get_metadata().get('city', '').upper()]
        
        # Take top results after filtering
        flights = flights[:limit // 2]
        hotels = hotels[:limit - len(flights)]
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
    # Parse intent using OpenAI (with fallback)
    result = await intent_parser.parse(query.user_id, query.message, query.conversation_history)
    
    intent = result.get('intent', 'unknown')
    entities = result.get('entities', {})
    confidence = result.get('confidence', 0.0)
    
    # Check if we have enough info to perform a search
    has_origin = entities.get('origin')
    has_destination = entities.get('destination')
    has_start_date = entities.get('start_date')
    has_end_date = entities.get('end_date')
    has_dates = has_start_date and has_end_date
    
    # Debug logging
    print(f"🔍 Intent: {intent}, Confidence: {confidence}")
    print(f"📍 Entities extracted: {entities}")
    print(f"✓ has_origin: {has_origin}, has_destination: {has_destination}, has_dates: {has_dates}")
    
    # Generate response based on intent
    response_text = ""
    
    # If we have enough info for trip planning, perform the search (dates optional)
    if intent == 'plan_trip' and has_origin and has_destination:
        try:
            user_context = {
                'user_id': query.user_id,
                'origin': entities.get('origin'),
                'destination': entities.get('destination'),
                'start_date': entities.get('start_date'),
                'end_date': entities.get('end_date'),
                'budget': entities.get('budget', 5000),
                'party_size': entities.get('party_size', 1),
                'preferences': entities.get('preferences', [])
            }
            
            plans = await trip_planner.plan_trip(user_context)
            
            if plans:
                best_plan = plans[0]
                total_cost = best_plan.get('total_cost', 0)
                flight = best_plan.get('flight', {})
                hotel = best_plan.get('hotel', {})
                
                response_text = f"Great! I found some options for your trip from {entities.get('origin')} to {entities.get('destination')}:\n\n"
                response_text += f"🎯 Best Bundle (${total_cost:.0f} total):\n"
                response_text += f"✈️ Flight: {flight.get('title', 'N/A')} - ${flight.get('price', 0):.0f}\n"
                response_text += f"🏨 Hotel: {hotel.get('title', 'N/A')} - ${hotel.get('price', 0):.0f}/night\n\n"
                response_text += f"Check the 'Top Deals' sidebar for more options!"
            else:
                response_text = f"I searched for trips from {entities.get('origin')} to {entities.get('destination')}, but couldn't find matches right now. Check the 'Top Deals' sidebar for current offers!"
        except Exception as e:
            print(f"Error planning trip: {e}")
            response_text = "I understand you want to plan a trip! Check the 'Top Deals' sidebar while I search for the best options."
    
    elif intent == 'search_flights':
        if has_origin and has_destination:
            response_text = f"Looking for flights from {entities.get('origin')} to {entities.get('destination')}! Check the 'Top Deals' sidebar for current flight offers. For the best results, let me know your travel dates!"
        else:
            response_text = "I can help you find flights! To give you the best results, I need:\n\n" \
                           "• Where are you flying from?\n" \
                           "• Where do you want to go?\n" \
                           "• What dates are you traveling?\n\n" \
                           "Check out the 'Top Deals' sidebar for our current best flight offers!"
    
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
        response_text = "Great! I'm tracking tons of deals right now. Check out the 'Top Deals' sidebar to see " \
                       "our best current offers. You can filter by:\n\n" \
                       "• Destination\n" \
                       "• Budget range\n" \
                       "• Travel dates\n\n" \
                       "Click any deal to book!"
    
    elif intent == 'general_inquiry' or intent == 'policy_question':
        # Check if asking about policy/deal questions
        question_lower = query.message.lower()
        if any(word in question_lower for word in ['policy', 'cancel', 'refund', 'pet', 'parking', 'amenity', 'breakfast', 'deal', 'why', 'good']):
            # Answer policy/deal question
            try:
                answer = await answer_policy_question(query.message, {})
                response_text = answer
            except:
                response_text = "For policy questions (cancellation, pets, parking, etc.), please check the specific deal details in the Top Deals sidebar. Most deals show 'refundable' or 'non-refundable' tags. Hotels with 🐕 are pet-friendly, and those with 🚇 are near transit!"
        # Smart fallback: If we have origin/destination, treat as flight search even if intent unclear
        elif has_origin and has_destination:
            response_text = f"Looking for flights from {entities.get('origin')} to {entities.get('destination')}! "
            if has_dates:
                response_text += f"I see you want to travel around {entities.get('start_date')}. "
            response_text += "Check the 'Top Deals' sidebar for current flight offers!"
        elif has_destination:
            response_text = f"Looking for travel options to {entities.get('destination')}! Check the 'Top Deals' sidebar for flights and hotels. Let me know your travel dates for personalized results!"
        else:
            response_text = "I'm here to help with your travel needs! I can:\n\n" \
                           "✈️ Find cheap flights\n" \
                           "🏨 Search for hotels\n" \
                           "🎒 Plan complete trips\n" \
                           "💰 Track deals and price drops\n\n" \
                           "What would you like to do?"
    
    else:
        response_text = "I'm your AI travel assistant! Try asking me:\n\n" \
                       "• 'Find me a cheap flight to Miami'\n" \
                       "• 'I need a hotel in Tokyo under $200/night'\n" \
                       "• 'Plan a trip from San Jose to Miami, December 20-23'\n\n" \
                       "What can I help you with?"
    
    return ChatResponse(
        response=response_text,
        intent=intent,
        entities=entities,
        confidence=confidence
    )

@app.post("/api/ai/trip/plan", response_model=TripPlanResponse)
async def plan_trip_endpoint(request: TripPlanRequest):
    """Plan a complete trip with flights and hotels"""
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
    
    plans = await trip_planner.plan_trip(user_context)
    
    if not plans:
        raise HTTPException(status_code=404, detail="No suitable trips found")
    
    best_plan = plans[0]
    plan_id = str(uuid.uuid4())
    
    # Generate explanation using OpenAI
    explanation = await generate_explanation(
        deal={'type': 'bundle', **best_plan},
        context=user_context,
        max_words=config.EXPLANATION_MAX_WORDS
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
    Generate explanation for why a deal is recommended
    
    Returns:
        - explanation: Why this deal (≤25 words)
        - watch_points: What to watch (≤12 words)
    """
    deal_id = request.get('deal_id')
    user_context = request.get('user_context', {})
    
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
    
    # Generate "why this" explanation (≤25 words)
    explanation = await generate_explanation(
        deal_dict,
        user_context,
        max_words=config.EXPLANATION_MAX_WORDS
    )
    
    # Generate "what to watch" (≤12 words)
    watch_alert = await generate_watch_alert(
        {
            'deal_type': deal.type,
            'price': deal.price,
            'inventory': deal.get_metadata().get('available_inventory', 'limited'),
            'expires': deal.expires_at
        },
        max_words=config.WATCH_ALERT_MAX_WORDS
    )
    
    session.close()
    
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

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket, user_id: str = Query(...)):
    """WebSocket endpoint for real-time updates"""
    await ws_service.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
            await ws_service.send_to_user(user_id, {"type": "ack", "message": "received"})
    except WebSocketDisconnect:
        ws_service.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)

