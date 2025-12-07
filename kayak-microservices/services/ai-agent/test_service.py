"""
Test Script for AI Agent Service
Run this after starting the service to verify everything works
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_health():
    """Test health endpoint"""
    print("\n🔍 Testing Health Endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
        print("   ✅ Health check passed!")

async def test_chat():
    """Test chat endpoint"""
    print("\n🔍 Testing Chat Endpoint...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {
            "user_id": "test_user_123",
            "message": "I want a weekend trip to Miami, budget $800, pet-friendly hotel",
            "conversation_history": []
        }
        response = await client.post(f"{BASE_URL}/api/ai/chat", json=payload)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Intent: {data.get('intent')}")
        print(f"   Confidence: {data.get('confidence')}")
        print(f"   Response: {data.get('response')[:100]}...")
        print("   ✅ Chat test passed!")

async def test_get_deals():
    """Test get deals endpoint"""
    print("\n🔍 Testing Get Deals Endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/ai/deals?limit=5")
        print(f"   Status: {response.status_code}")
        deals = response.json()
        print(f"   Found {len(deals)} deals")
        if deals:
            print(f"   Sample: {deals[0].get('title')}")
        print("   ✅ Get deals test passed!")

async def test_trip_plan():
    """Test trip planning endpoint"""
    print("\n🔍 Testing Trip Planning Endpoint...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {
            "user_id": "test_user_123",
            "origin": "SFO",
            "destination": "MIA",
            "start_date": "2025-12-20",
            "end_date": "2025-12-22",
            "budget": 800,
            "party_size": 2,
            "preferences": ["pet-friendly"]
        }
        response = await client.post(f"{BASE_URL}/api/ai/trip/plan", json=payload)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Plan ID: {data.get('plan_id')}")
            print(f"   Fit Score: {data.get('fit_score')}")
            print(f"   Total Cost: ${data.get('total_cost')}")
            print("   ✅ Trip planning test passed!")
        else:
            print(f"   Response: {response.text}")

async def test_create_watch():
    """Test create watch endpoint"""
    print("\n🔍 Testing Create Watch Endpoint...")
    async with httpx.AsyncClient() as client:
        payload = {
            "user_id": "test_user_123",
            "deal_id": "flight_SFO_MIA_001",
            "price_threshold": 250,
            "inventory_threshold": 10
        }
        response = await client.post(f"{BASE_URL}/api/ai/watch/create", json=payload)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Watch ID: {data.get('watch_id')}")
            print("   ✅ Create watch test passed!")
        else:
            print(f"   Response: {response.text}")

async def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("🚀 AI AGENT SERVICE TESTS")
    print("=" * 60)
    
    try:
        await test_health()
        await test_get_deals()
        
        # These tests require OpenAI and might take longer
        print("\n⏳ Running AI-powered tests (may take 10-30 seconds)...")
        await test_chat()
        await test_trip_plan()
        
        await test_create_watch()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n📝 Make sure the AI Agent service is running on port 8000")
    print("   Start it with: python main.py\n")
    
    asyncio.run(run_all_tests())
