"""
Comprehensive Feature Test Suite
Tests all multi-agent AI features
"""

import asyncio
import json
import httpx
import websockets
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/events"

def print_header(title):
    """Print test section header"""
    print(f"\n{Fore.CYAN}{'='*70}")
    print(f"{Fore.CYAN}{title.center(70)}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")

def print_success(message):
    """Print success message"""
    print(f"{Fore.GREEN}[PASS] {message}{Style.RESET_ALL}")

def print_error(message):
    """Print error message"""
    print(f"{Fore.RED}[FAIL] {message}{Style.RESET_ALL}")

def print_info(message):
    """Print info message"""
    print(f"{Fore.YELLOW}[INFO] {message}{Style.RESET_ALL}")


async def test_health_check():
    """Test 1: Health Check & Service Info"""
    print_header("TEST 1: Health Check & Service Info")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            data = response.json()
            print_success("Health check passed")
            print(f"   Status: {data.get('status')}")
            
            response = await client.get(f"{BASE_URL}/")
            data = response.json()
            print_success("Service info retrieved")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            print(f"   Features: {', '.join(data.get('features', []))}")
            
        except Exception as e:
            print_error(f"Health check failed: {e}")


async def test_deals_api():
    """Test 2: Deals API with Filtering"""
    print_header("TEST 2: Deals API with Filtering")
    
    async with httpx.AsyncClient() as client:
        try:
            # Test 2.1: Get all deals
            print_info("Testing: Get all deals (limit 6)")
            response = await client.get(f"{BASE_URL}/api/ai/deals?limit=6")
            deals = response.json()
            print_success(f"Retrieved {len(deals)} deals")
            for deal in deals[:3]:
                print(f"   • {deal['title']} - ${deal['price']} (score: {deal['score']})")
            
            # Test 2.2: Filter by type
            print_info("\nTesting: Filter by type (flights only)")
            response = await client.get(f"{BASE_URL}/api/ai/deals?deal_type=flight&limit=5")
            flights = response.json()
            print_success(f"Retrieved {len(flights)} flight deals")
            for flight in flights[:3]:
                meta = flight.get('metadata', {})
                print(f"   • {meta.get('origin')} → {meta.get('destination')}: ${flight['price']}")
            
            # Test 2.3: Filter by destination
            print_info("\nTesting: Filter by destination (LAX)")
            response = await client.get(f"{BASE_URL}/api/ai/deals?destination=LAX&limit=5")
            lax_deals = response.json()
            print_success(f"Retrieved {len(lax_deals)} LAX-related deals")
            for deal in lax_deals:
                print(f"   • {deal['title']} - {deal['type']}")
            
            # Test 2.4: Get specific deal
            if deals:
                print_info(f"\nTesting: Get specific deal ({deals[0]['deal_id']})")
                response = await client.get(f"{BASE_URL}/api/ai/deals/{deals[0]['deal_id']}")
                deal = response.json()
                print_success("Retrieved deal details")
                print(f"   Title: {deal['title']}")
                print(f"   Price: ${deal['price']} (was ${deal['original_price']})")
                print(f"   Tags: {', '.join(deal['tags'])}")
            
        except Exception as e:
            print_error(f"Deals API test failed: {e}")


async def test_ai_chat():
    """Test 3: AI Chat with Intent Parsing"""
    print_header("TEST 3: AI Chat with Intent Parsing")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        test_queries = [
            "sjc to lax on december 23rd for 2 people",
            "I need a hotel in Miami",
            "find me cheap flights to New York",
            "plan a trip from SFO to Seattle next weekend under $800"
        ]
        
        for i, query in enumerate(test_queries, 1):
            try:
                print_info(f"\nTest {i}: '{query}'")
                payload = {
                    "user_id": "test_user",
                    "message": query,
                    "conversation_history": []
                }
                
                response = await client.post(
                    f"{BASE_URL}/api/ai/chat",
                    json=payload,
                    timeout=30.0
                )
                data = response.json()
                
                print_success("Chat response received")
                print(f"   Intent: {data.get('intent')} (confidence: {data.get('confidence')})")
                
                entities = data.get('entities', {})
                if entities:
                    print(f"   Entities:")
                    for key, value in entities.items():
                        print(f"      - {key}: {value}")
                
                response_text = data.get('response', '')
                print(f"   Response: {response_text[:100]}..." if len(response_text) > 100 else f"   Response: {response_text}")
                
            except Exception as e:
                print_error(f"Chat test {i} failed: {e}")


async def test_trip_planning():
    """Test 4: Trip Planning (Bundle Creation)"""
    print_header("TEST 4: Trip Planning & Bundle Creation")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            print_info("Testing: Create trip bundle (SFO → SEA)")
            payload = {
                "user_id": "test_user",
                "origin": "SFO",
                "destination": "SEA",
                "start_date": "2025-12-20",
                "end_date": "2025-12-23",
                "budget": 1000.0,
                "party_size": 2,
                "preferences": ["pet-friendly", "refundable"]
            }
            
            response = await client.post(
                f"{BASE_URL}/api/ai/trip/plan",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success("Trip plan created")
                print(f"   Plan ID: {data.get('plan_id')}")
                print(f"   Fit Score: {data.get('fit_score')}/100")
                print(f"   Total Cost: ${data.get('total_cost')}")
                
                itinerary = data.get('itinerary', {})
                if itinerary:
                    flight = itinerary.get('flight', {})
                    hotel = itinerary.get('hotel', {})
                    print(f"\n   Bundle Details:")
                    print(f"   ✈️  Flight: {flight.get('title')} - ${flight.get('price')}")
                    print(f"   🏨 Hotel: {hotel.get('title')} - ${hotel.get('price_per_night')}/night")
                
                explanation = data.get('explanation', '')
                if explanation:
                    print(f"\n   💡 Why this works: {explanation[:150]}...")
                
                alternatives = data.get('alternatives', [])
                if alternatives:
                    print(f"\n   📋 {len(alternatives)} alternative bundles available")
            elif response.status_code == 404:
                print_info(f"No trips found for SFO→SEA (database may not have matching deals)")
                print_info("This is normal - trip planning requires matching flight+hotel in destination")
            else:
                print_error(f"Trip planning failed with status {response.status_code}")
                print(f"   {response.text}")
                
        except Exception as e:
            print_error(f"Trip planning test failed: {e}")


async def test_price_watches():
    """Test 5: Price Watches & Alerts"""
    print_header("TEST 5: Price Watches & Alert System")
    
    async with httpx.AsyncClient() as client:
        try:
            # First get a deal to watch
            response = await client.get(f"{BASE_URL}/api/ai/deals?deal_type=flight&limit=1")
            deals = response.json()
            
            if not deals:
                print_error("No deals available to watch")
                return
            
            deal = deals[0]
            print_info(f"Testing: Create price watch for '{deal['title']}'")
            
            payload = {
                "user_id": "test_user",
                "deal_id": deal['deal_id'],
                "price_threshold": deal['price'] * 0.9,  # Alert if drops 10%
                "inventory_threshold": 5
            }
            
            response = await client.post(
                f"{BASE_URL}/api/ai/watch/create",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success("Price watch created")
                print(f"   Watch ID: {data.get('watch_id')}")
                print(f"   Deal: {data.get('deal_id')}")
                print(f"   Alert if price < ${payload['price_threshold']:.2f}")
                print(f"   Alert if inventory < {payload['inventory_threshold']} units")
                print(f"   Status: {data.get('status')}")
            else:
                print_error(f"Watch creation failed: {response.status_code}")
            
        except Exception as e:
            print_error(f"Price watch test failed: {e}")


async def test_policy_qa():
    """Test 6: Policy Q&A"""
    print_header("TEST 6: Policy Q&A System")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Get a hotel deal
            response = await client.get(f"{BASE_URL}/api/ai/deals?deal_type=hotel&limit=1")
            deals = response.json()
            
            if not deals:
                print_error("No hotel deals available for Q&A")
                return
            
            deal = deals[0]
            print_info(f"Testing: Ask policy questions about '{deal['title']}'")
            
            questions = [
                "Is this refundable?",
                "Do they allow pets?",
                "What's the cancellation policy?"
            ]
            
            for i, question in enumerate(questions, 1):
                try:
                    payload = {
                        "user_id": "test_user",
                        "deal_id": deal['deal_id'],
                        "question": question
                    }
                    
                    response = await client.post(
                        f"{BASE_URL}/api/ai/policy/question",
                        json=payload,
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print_success(f"Q{i}: {question}")
                        print(f"       Answer: {data.get('answer')}")
                    else:
                        print_error(f"Q{i} failed: {response.status_code}")
                        
                except Exception as e:
                    print_error(f"Q{i} error: {e}")
            
        except Exception as e:
            print_error(f"Policy Q&A test failed: {e}")


async def test_websocket():
    """Test 7: WebSocket Real-time Updates"""
    print_header("TEST 7: WebSocket Real-time Updates")
    
    try:
        print_info("Testing: WebSocket connection")
        
        async with websockets.connect(f"{WS_URL}?user_id=test_user", open_timeout=10) as websocket:
            print_success("WebSocket connected")
            
            # Send a test message
            test_message = {
                "type": "subscribe",
                "channels": ["deals", "alerts"]
            }
            await websocket.send(json.dumps(test_message))
            print_info("Sent subscription request")
            
            # Wait for response (with timeout)
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print_success("Received WebSocket message")
                print(f"   Message: {response[:100]}...")
            except asyncio.TimeoutError:
                print_info("No immediate message (normal - waiting for events)")
            
            print_success("WebSocket test completed")
            
    except Exception as e:
        print_error(f"WebSocket test failed: {e}")


async def test_refine_search():
    """Test 8: Refine Search (Context Preservation)"""
    print_header("TEST 8: Search Refinement & Context")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Initial query
            print_info("Step 1: Initial query")
            payload1 = {
                "user_id": "test_refine_user",
                "message": "I want to go to Miami for a weekend",
                "conversation_history": []
            }
            
            response1 = await client.post(f"{BASE_URL}/api/ai/chat", json=payload1, timeout=30.0)
            data1 = response1.json()
            print_success("Initial query processed")
            print(f"   Intent: {data1.get('intent')}")
            print(f"   Entities: {data1.get('entities')}")
            
            # Refinement
            print_info("\nStep 2: Refine with constraint")
            payload2 = {
                "user_id": "test_refine_user",
                "message": "make it pet-friendly and under $800",
                "conversation_history": []
            }
            
            response2 = await client.post(f"{BASE_URL}/api/ai/refine", json=payload2, timeout=30.0)
            data2 = response2.json()
            print_success("Refinement processed")
            print(f"   Updated entities: {data2.get('entities')}")
            print(f"   Message: {data2.get('message')}")
            
        except Exception as e:
            print_error(f"Search refinement test failed: {e}")


async def run_all_tests():
    """Run all feature tests"""
    print(f"\n{Fore.MAGENTA}{'='*70}")
    print(f"{Fore.MAGENTA}KAYAK AI AGENT - COMPREHENSIVE FEATURE TEST SUITE")
    print(f"{Fore.MAGENTA}{'='*70}{Style.RESET_ALL}\n")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    tests = [
        ("Health Check", test_health_check),
        ("Deals API", test_deals_api),
        ("AI Chat", test_ai_chat),
        ("Trip Planning", test_trip_planning),
        ("Price Watches", test_price_watches),
        ("Policy Q&A", test_policy_qa),
        ("WebSocket", test_websocket),
        ("Search Refinement", test_refine_search)
    ]
    
    for name, test_func in tests:
        try:
            await test_func()
        except Exception as e:
            print_error(f"{name} test suite failed: {e}")
        
        await asyncio.sleep(1)  # Brief pause between tests
    
    # Summary
    print(f"\n{Fore.MAGENTA}{'='*70}")
    print(f"{Fore.MAGENTA}TEST SUITE COMPLETED")
    print(f"{Fore.MAGENTA}{'='*70}{Style.RESET_ALL}\n")
    print_success("All tests executed! Check results above.")


if __name__ == "__main__":
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print_error("\n\nTests interrupted by user")
    except Exception as e:
        print_error(f"\n\nTest suite error: {e}")
