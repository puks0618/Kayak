"""
AI Agent Service Main Entry Point
FastAPI application for deals detection and AI concierge
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Deal, UserQuery, TripPlan
from services.websocket_service import WebSocketService
from agents.deal_detector import DealDetector
from agents.intent_parser import IntentParser
from typing import List

app = FastAPI(
    title="Kayak AI Agent",
    description="AI-powered deals and concierge service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket service
ws_service = WebSocketService()

# Agents
deal_detector = DealDetector()
intent_parser = IntentParser()

@app.get("/")
def root():
    return {"message": "Kayak AI Agent Service", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "ai-agent"}

# Deals Router
@app.get("/api/ai/deals", response_model=List[Deal])
async def get_deals(limit: int = 10):
    """Get current deals"""
    # For MVP, return mock detected deals
    deals = await deal_detector.run_mock_detection()
    return deals[:limit]

@app.post("/api/ai/deals/detect")
async def detect_deals():
    """Trigger deal detection"""
    # In a real scenario, this would trigger a background task
    deals = await deal_detector.run_mock_detection()
    return {"message": "Deal detection completed", "deals_found": len(deals)}

# Concierge Router
@app.post("/api/ai/concierge/query")
async def process_query(query: UserQuery):
    """Process natural language query"""
    result = await intent_parser.parse(query)
    
    response_text = f"I understood you want to {result['intent']} a {result['entities'].get('type', 'listing')}."
    if result['intent'] == 'unknown':
        response_text = "I'm not sure what you mean. Can you please clarify?"
        
    return {
        "response": response_text,
        "intent": result['intent'],
        "entities": result['entities']
    }

@app.post("/api/ai/concierge/plan-trip")
async def plan_trip(trip_plan: TripPlan):
    """Plan a complete trip"""
    # TODO: Integrate TripPlanner agent
    return {"itinerary": [], "estimated_cost": 0}

# WebSocket endpoint for real-time events
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await ws_service.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await ws_service.send_to_client(websocket, {"message": data})
    except WebSocketDisconnect:
        ws_service.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

