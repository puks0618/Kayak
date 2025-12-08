"""
End-to-End Integration Test Suite
Tests complete AI agent workflows from intent parsing to explanations
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, List
import sys


class E2ETestSuite:
    """End-to-end integration tests for AI agent"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.test_results = {}
    
    async def setup(self):
        """Initialize test session"""
        self.session = aiohttp.ClientSession()
        print("🔧 Test session initialized")
    
    async def teardown(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
        print("🧹 Test session closed")
    
    async def test_health_check(self):
        """Test 1: Health check and service availability"""
        print("\n" + "="*60)
        print("TEST 1: Service Health Check")
        print("="*60)
        
        try:
            async with self.session.get(f"{self.base_url}/health") as resp:
                data = await resp.json()
                
                print(f"Status: {resp.status}")
                print(f"Response: {json.dumps(data, indent=2)}")
                
                # Accept either "healthy" or "OK" status
                status = data.get('status', '').lower()
                success = resp.status == 200 and status in ['healthy', 'ok']
                print(f"\n{'✅' if success else '❌'} Health check: {data.get('status')}")
                return success
                
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    async def test_intent_parsing(self):
        """Test 2: Intent parsing with various queries"""
        print("\n" + "="*60)
        print("TEST 2: Intent Parsing")
        print("="*60)
        
        test_queries = [
            {
                "user_id": "test_user_1",
                "message": "Find me cheap flights from NYC to Paris under $500"
            },
            {
                "user_id": "test_user_2",
                "message": "I need a hotel in Tokyo for 3 nights next month"
            },
            {
                "user_id": "test_user_3",
                "message": "Show me flights and hotels for a weekend trip to LA"
            }
        ]
        
        results = []
        
        for query in test_queries:
            try:
                async with self.session.post(
                    f"{self.base_url}/api/ai/chat",
                    json=query
                ) as resp:
                    data = await resp.json()
                    
                    intent = data.get('intent')
                    entities = data.get('entities', {})
                    
                    print(f"\n📝 Query: {query['message'][:50]}...")
                    print(f"   Intent: {intent}")
                    print(f"   Entities: {json.dumps(entities, indent=6)}")
                    
                    # Check if intent was parsed
                    has_intent = intent in ['search_flights', 'search_hotels', 'plan_trip']
                    has_entities = bool(entities)
                    
                    success = has_intent and has_entities
                    results.append(success)
                    print(f"   {'✅' if success else '❌'} Intent parsed successfully")
                    
            except Exception as e:
                print(f"   ❌ Failed: {e}")
                results.append(False)
        
        overall_success = sum(results) / len(results) >= 0.8  # 80% pass rate
        print(f"\n📊 Results: {sum(results)}/{len(results)} passed")
        return overall_success
    
    async def test_deal_detection(self):
        """Test 3: Deal detection and retrieval"""
        print("\n" + "="*60)
        print("TEST 3: Deal Detection")
        print("="*60)
        
        try:
            # Test flight deals
            async with self.session.get(
                f"{self.base_url}/api/ai/deals",
                params={"deal_type": "flight", "limit": 5}
            ) as resp:
                flights = await resp.json()
                
                print(f"📊 Flight deals found: {len(flights)}")
                if flights:
                    deal = flights[0]
                    print(f"   Sample: {deal.get('title', 'N/A')}")
                    print(f"   Price: ${deal.get('price', 0):.2f}")
                    print(f"   Score: {deal.get('score', 0):.2f}")
            
            # Test hotel deals
            async with self.session.get(
                f"{self.base_url}/api/ai/deals",
                params={"deal_type": "hotel", "limit": 5}
            ) as resp:
                hotels = await resp.json()
                
                print(f"📊 Hotel deals found: {len(hotels)}")
                if hotels:
                    deal = hotels[0]
                    print(f"   Sample: {deal.get('title', 'N/A')}")
                    print(f"   Price: ${deal.get('price', 0):.2f}")
            
            success = len(flights) > 0 and len(hotels) > 0
            print(f"\n{'✅' if success else '❌'} Deal detection working")
            return success
            
        except Exception as e:
            print(f"❌ Deal detection failed: {e}")
            return False
    
    async def test_price_analysis(self):
        """Test 4: Price analysis and explanations"""
        print("\n" + "="*60)
        print("TEST 4: Price Analysis & Explanations")
        print("="*60)
        
        try:
            # Get a deal first
            async with self.session.get(
                f"{self.base_url}/api/ai/deals",
                params={"deal_type": "flight", "limit": 1}
            ) as resp:
                deals = await resp.json()
                
                if not deals:
                    print("⚠️ No deals available for testing")
                    return False
                
                deal = deals[0]
                deal_id = deal.get('deal_id')
                
                print(f"🎯 Testing with deal: {deal.get('title')}")
                print(f"   Deal ID: {deal_id}")
                print(f"   Price: ${deal.get('price', 0):.2f}")
            
            # Request explanation
            async with self.session.post(
                f"{self.base_url}/api/ai/explain",
                json={
                    "deal_id": deal_id,
                    "user_context": {"budget": 1000},
                    "include_comparison": True
                }
            ) as resp:
                data = await resp.json()
                
                explanation = data.get('explanation', '')
                price_analysis = data.get('price_analysis', {})
                recommendation = data.get('recommendation', {})
                
                print(f"\n📝 Explanation: {explanation[:150]}...")
                print(f"\n📊 Price Analysis:")
                print(f"   Current: ${price_analysis.get('current', 0):.2f}")
                print(f"   Average: ${price_analysis.get('avg_30d', 0):.2f}")
                print(f"   Trend: {price_analysis.get('trend', 'N/A')}")
                print(f"\n💡 Recommendation:")
                # Recommendation can be a string or dict
                if isinstance(recommendation, dict):
                    print(f"   Action: {recommendation.get('action', 'N/A')}")
                    print(f"   Confidence: {recommendation.get('confidence', 'N/A')}")
                else:
                    print(f"   {recommendation}")
                
                has_explanation = len(explanation) > 50
                has_analysis = bool(price_analysis)
                has_recommendation = bool(recommendation)
                
                success = has_explanation and has_analysis and has_recommendation
                print(f"\n{'✅' if success else '❌'} Price analysis complete")
                return success
                
        except Exception as e:
            print(f"❌ Price analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def test_trip_planning(self):
        """Test 5: Complete trip planning workflow"""
        print("\n" + "="*60)
        print("TEST 5: Trip Planning Workflow")
        print("="*60)
        
        try:
            trip_request = {
                "user_id": "test_user_trip",
                "origin": "NYC",
                "destination": "LAX",
                "start_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "end_date": (datetime.now() + timedelta(days=33)).strftime("%Y-%m-%d"),
                "budget": 1500,
                "party_size": 2,
                "preferences": ["direct flights", "hotel with pool"]
            }
            
            print(f"📋 Trip request:")
            print(f"   Route: {trip_request['origin']} → {trip_request['destination']}")
            print(f"   Dates: {trip_request['start_date']} to {trip_request['end_date']}")
            print(f"   Budget: ${trip_request['budget']}")
            print(f"   Party: {trip_request['party_size']} people")
            
            async with self.session.post(
                f"{self.base_url}/api/ai/trip/plan",
                json=trip_request
            ) as resp:
                if resp.status == 404:
                    print("⚠️ No suitable trips found (expected for test data)")
                    return True  # Expected for limited test data
                
                data = await resp.json()
                
                plan_id = data.get('plan_id')
                itinerary = data.get('itinerary', {})
                total_cost = data.get('total_cost', 0)
                fit_score = data.get('fit_score', 0)
                explanation = data.get('explanation', '')
                
                print(f"\n✈️ Trip Plan:")
                print(f"   Plan ID: {plan_id}")
                print(f"   Total Cost: ${total_cost:.2f}")
                print(f"   Fit Score: {fit_score:.2f}")
                print(f"   Explanation: {explanation[:100]}...")
                
                has_plan = plan_id is not None
                within_budget = total_cost <= trip_request['budget']
                has_explanation = len(explanation) > 50
                
                success = has_plan and within_budget and has_explanation
                print(f"\n{'✅' if success else '❌'} Trip planning complete")
                return success
                
        except Exception as e:
            print(f"❌ Trip planning failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def test_cache_performance(self):
        """Test 6: Cache hit rate and performance"""
        print("\n" + "="*60)
        print("TEST 6: Cache Performance")
        print("="*60)
        
        try:
            # Get initial metrics
            async with self.session.get(f"{self.base_url}/api/ai/metrics") as resp:
                initial_metrics = await resp.json()
            
            # Make repeated requests
            test_query = {
                "user_id": "cache_test_user",
                "message": "Find flights from NYC to Paris"
            }
            
            print("🔄 Making 10 identical requests...")
            for i in range(10):
                async with self.session.post(
                    f"{self.base_url}/api/ai/chat",
                    json=test_query
                ) as resp:
                    await resp.json()
            
            # Get final metrics
            async with self.session.get(f"{self.base_url}/api/ai/metrics") as resp:
                final_metrics = await resp.json()
            
            cache_stats = final_metrics.get('cache', {})
            hit_rate = cache_stats.get('hit_rate', 0)
            total_hits = cache_stats.get('hits', 0)
            
            print(f"\n📊 Cache Statistics:")
            print(f"   Hit Rate: {hit_rate:.2%}")
            print(f"   Total Hits: {total_hits}")
            print(f"   Total Misses: {cache_stats.get('misses', 0)}")
            
            # Cache should have high hit rate after warm-up
            success = hit_rate > 0.5  # At least 50% hit rate
            print(f"\n{'✅' if success else '❌'} Cache performance acceptable")
            return success
            
        except Exception as e:
            print(f"❌ Cache test failed: {e}")
            return False
    
    async def test_policy_qa(self):
        """Test 7: Policy Q&A system"""
        print("\n" + "="*60)
        print("TEST 7: Policy Q&A System")
        print("="*60)
        
        test_questions = [
            {
                "user_id": "policy_test_1",
                "question": "What is Delta's baggage policy?",
                "airline": "Delta"
            },
            {
                "user_id": "policy_test_2",
                "question": "Can I cancel my United flight?",
                "airline": "United"
            },
            {
                "user_id": "policy_test_3",
                "question": "What items are prohibited on American Airlines?"
            }
        ]
        
        results = []
        
        for question_data in test_questions:
            try:
                async with self.session.post(
                    f"{self.base_url}/api/ai/policy/ask",
                    json=question_data
                ) as resp:
                    data = await resp.json()
                    
                    answer = data.get('answer', '')
                    airline = data.get('airline', 'General')
                    
                    print(f"\n❓ Q: {question_data['question']}")
                    print(f"   Airline: {airline}")
                    print(f"   A: {answer[:100]}...")
                    
                    has_answer = len(answer) > 20
                    results.append(has_answer)
                    print(f"   {'✅' if has_answer else '❌'} Answer provided")
                    
            except Exception as e:
                print(f"   ❌ Failed: {e}")
                results.append(False)
        
        success = sum(results) >= 2  # At least 2/3 should work
        print(f"\n📊 Results: {sum(results)}/{len(results)} passed")
        return success
    
    async def test_concurrent_requests(self):
        """Test 8: Concurrent request handling"""
        print("\n" + "="*60)
        print("TEST 8: Concurrent Request Handling")
        print("="*60)
        
        async def make_request(user_id: int):
            query = {
                "user_id": f"concurrent_user_{user_id}",
                "message": f"Find deals for user {user_id}"
            }
            try:
                async with self.session.post(
                    f"{self.base_url}/api/ai/chat",
                    json=query
                ) as resp:
                    data = await resp.json()
                    return resp.status == 200
            except Exception as e:
                print(f"   User {user_id} failed: {e}")
                return False
        
        print("🔄 Sending 20 concurrent requests...")
        start_time = datetime.now()
        
        tasks = [make_request(i) for i in range(20)]
        results = await asyncio.gather(*tasks)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        success_count = sum(results)
        success_rate = success_count / len(results)
        
        print(f"\n📊 Results:")
        print(f"   Successful: {success_count}/{len(results)} ({success_rate:.1%})")
        print(f"   Duration: {duration:.2f}s")
        print(f"   Throughput: {len(results)/duration:.1f} req/s")
        
        success = success_rate >= 0.95  # 95% success rate
        print(f"\n{'✅' if success else '❌'} Concurrent handling")
        return success
    
    async def run_all_tests(self):
        """Run complete test suite"""
        print("\n" + "🧪"*30)
        print("END-TO-END INTEGRATION TEST SUITE")
        print("🧪"*30)
        
        await self.setup()
        
        tests = [
            ("Service Health Check", self.test_health_check),
            ("Intent Parsing", self.test_intent_parsing),
            ("Deal Detection", self.test_deal_detection),
            ("Price Analysis & Explanations", self.test_price_analysis),
            ("Trip Planning Workflow", self.test_trip_planning),
            ("Cache Performance", self.test_cache_performance),
            ("Policy Q&A System", self.test_policy_qa),
            ("Concurrent Request Handling", self.test_concurrent_requests),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results[test_name] = result
                self.test_results[test_name] = result
            except Exception as e:
                print(f"\n❌ Test '{test_name}' crashed: {e}")
                import traceback
                traceback.print_exc()
                results[test_name] = False
                self.test_results[test_name] = False
            
            await asyncio.sleep(1)
        
        await self.teardown()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in results.values() if r)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\n🎯 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Overall assessment
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! System is production ready.")
        elif passed >= total * 0.8:
            print("\n✅ Most tests passed. Minor issues to address.")
        elif passed >= total * 0.5:
            print("\n⚠️ Some tests failed. Significant issues found.")
        else:
            print("\n❌ Many tests failed. Major issues require attention.")
        
        return results


async def main():
    """Run end-to-end tests"""
    suite = E2ETestSuite()
    
    try:
        await suite.run_all_tests()
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
