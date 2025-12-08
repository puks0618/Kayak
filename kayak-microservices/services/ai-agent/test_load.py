"""
Phase 5: Load Testing & Stress Testing Framework
Tests AI Agent service under high load and stress conditions
"""

import asyncio
import aiohttp
import time
import json
import statistics
from typing import List, Dict, Any, Tuple
from datetime import datetime
import sys

# Test Configuration
BASE_URL = "http://localhost:8000"
CONCURRENT_USERS = [10, 50, 100, 500, 1000]  # Progressive load
REQUESTS_PER_USER = 10
TIMEOUT = 30  # seconds

# Test Data
TEST_QUERIES = [
    "What are the baggage fees for Southwest?",
    "Can I cancel my flight?",
    "Find flights to Miami",
    "Plan a trip to Tokyo for 2 people under $3000",
    "What are the refund policies?",
    "How do I change my booking?",
    "Find hotels in New York",
    "What are the check-in requirements?",
    "Plan a trip to Paris under $2000",
    "Does Spirit charge for carry-on bags?",
]

TEST_DEAL_QUERIES = [
    {"limit": 10, "min_score": 50},
    {"limit": 20, "deal_type": "flight"},
    {"limit": 30, "deal_type": "hotel"},
    {"limit": 50, "min_score": 0},
    {"limit": 100, "min_score": 70},
]


class PerformanceMetrics:
    """Track performance metrics during tests"""
    
    def __init__(self):
        self.response_times = []
        self.errors = []
        self.successful_requests = 0
        self.failed_requests = 0
        self.start_time = None
        self.end_time = None
    
    def record_success(self, response_time: float):
        self.response_times.append(response_time)
        self.successful_requests += 1
    
    def record_error(self, error: str):
        self.errors.append(error)
        self.failed_requests += 1
    
    def get_stats(self) -> Dict[str, Any]:
        if not self.response_times:
            return {
                "success_rate": 0,
                "error_rate": 100,
                "total_requests": self.failed_requests,
                "errors": len(self.errors)
            }
        
        total = self.successful_requests + self.failed_requests
        duration = (self.end_time - self.start_time) if self.end_time else 0
        
        return {
            "total_requests": total,
            "successful": self.successful_requests,
            "failed": self.failed_requests,
            "success_rate": (self.successful_requests / total * 100) if total > 0 else 0,
            "error_rate": (self.failed_requests / total * 100) if total > 0 else 0,
            "duration_seconds": duration,
            "requests_per_second": total / duration if duration > 0 else 0,
            "response_times": {
                "min": min(self.response_times),
                "max": max(self.response_times),
                "mean": statistics.mean(self.response_times),
                "median": statistics.median(self.response_times),
                "p95": statistics.quantiles(self.response_times, n=20)[18] if len(self.response_times) > 20 else max(self.response_times),
                "p99": statistics.quantiles(self.response_times, n=100)[98] if len(self.response_times) > 100 else max(self.response_times),
            },
            "errors": self.errors[:10]  # First 10 errors
        }


async def make_chat_request(session: aiohttp.ClientSession, message: str, user_id: str) -> Tuple[bool, float, str]:
    """Make a chat API request"""
    start = time.time()
    try:
        async with session.post(
            f"{BASE_URL}/api/ai/chat",
            json={"user_id": user_id, "message": message},
            timeout=aiohttp.ClientTimeout(total=TIMEOUT)
        ) as response:
            await response.json()
            elapsed = time.time() - start
            return (response.status == 200, elapsed, "")
    except asyncio.TimeoutError:
        return (False, time.time() - start, "Timeout")
    except Exception as e:
        return (False, time.time() - start, str(e))


async def make_deals_request(session: aiohttp.ClientSession, params: Dict[str, Any]) -> Tuple[bool, float, str]:
    """Make a deals API request"""
    start = time.time()
    try:
        async with session.get(
            f"{BASE_URL}/api/ai/deals",
            params=params,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT)
        ) as response:
            await response.json()
            elapsed = time.time() - start
            return (response.status == 200, elapsed, "")
    except asyncio.TimeoutError:
        return (False, time.time() - start, "Timeout")
    except Exception as e:
        return (False, time.time() - start, str(e))


async def make_metrics_request(session: aiohttp.ClientSession) -> Tuple[bool, Dict[str, Any]]:
    """Get metrics from the service"""
    try:
        async with session.get(
            f"{BASE_URL}/api/ai/metrics",
            timeout=aiohttp.ClientTimeout(total=10)
        ) as response:
            if response.status == 200:
                return (True, await response.json())
            return (False, {})
    except Exception:
        return (False, {})


async def user_session(user_id: int, requests_per_user: int, metrics: PerformanceMetrics):
    """Simulate a user making multiple requests"""
    async with aiohttp.ClientSession() as session:
        for i in range(requests_per_user):
            # Alternate between chat and deals requests
            if i % 2 == 0:
                # Chat request
                message = TEST_QUERIES[i % len(TEST_QUERIES)]
                success, elapsed, error = await make_chat_request(session, message, f"user_{user_id}")
            else:
                # Deals request
                params = TEST_DEAL_QUERIES[i % len(TEST_DEAL_QUERIES)]
                success, elapsed, error = await make_deals_request(session, params)
            
            if success:
                metrics.record_success(elapsed)
            else:
                metrics.record_error(error or "Unknown error")
            
            # Small delay between requests
            await asyncio.sleep(0.1)


async def run_load_test(concurrent_users: int, requests_per_user: int) -> Dict[str, Any]:
    """Run load test with specified concurrent users"""
    print(f"\n{'='*60}")
    print(f"Load Test: {concurrent_users} concurrent users, {requests_per_user} requests each")
    print(f"Total requests: {concurrent_users * requests_per_user}")
    print(f"{'='*60}")
    
    metrics = PerformanceMetrics()
    metrics.start_time = time.time()
    
    # Create tasks for all users
    tasks = [
        user_session(user_id, requests_per_user, metrics)
        for user_id in range(concurrent_users)
    ]
    
    # Run all users concurrently
    await asyncio.gather(*tasks)
    
    metrics.end_time = time.time()
    
    # Get service metrics after test
    async with aiohttp.ClientSession() as session:
        _, service_metrics = await make_metrics_request(session)
    
    stats = metrics.get_stats()
    stats["service_metrics"] = service_metrics
    
    return stats


async def run_cache_test() -> Dict[str, Any]:
    """Test cache effectiveness with repeated queries"""
    print(f"\n{'='*60}")
    print("Cache Effectiveness Test")
    print(f"{'='*60}")
    
    async with aiohttp.ClientSession() as session:
        # Get initial metrics
        _, initial_metrics = await make_metrics_request(session)
        initial_hits = initial_metrics.get("cache", {}).get("hits", 0)
        initial_misses = initial_metrics.get("cache", {}).get("misses", 0)
        
        # Make repeated requests (should hit cache)
        repeated_query = "What are the baggage fees for Southwest?"
        repeat_count = 100
        
        print(f"Making {repeat_count} identical requests...")
        tasks = []
        for i in range(repeat_count):
            tasks.append(make_chat_request(session, repeated_query, f"cache_test_{i}"))
        
        results = await asyncio.gather(*tasks)
        successful = sum(1 for success, _, _ in results if success)
        
        # Get final metrics
        await asyncio.sleep(1)  # Let metrics update
        _, final_metrics = await make_metrics_request(session)
        final_hits = final_metrics.get("cache", {}).get("hits", 0)
        final_misses = final_metrics.get("cache", {}).get("misses", 0)
        
        hits_gained = final_hits - initial_hits
        misses_gained = final_misses - initial_misses
        cache_hit_rate = (hits_gained / (hits_gained + misses_gained) * 100) if (hits_gained + misses_gained) > 0 else 0
        
        return {
            "repeated_requests": repeat_count,
            "successful": successful,
            "cache_hits_gained": hits_gained,
            "cache_misses_gained": misses_gained,
            "cache_hit_rate": cache_hit_rate,
            "final_cache_stats": final_metrics.get("cache", {})
        }


async def run_stress_test() -> Dict[str, Any]:
    """Stress test with maximum concurrent requests"""
    print(f"\n{'='*60}")
    print("Stress Test: Maximum Load")
    print(f"{'='*60}")
    
    # Query for large dataset
    async with aiohttp.ClientSession() as session:
        start = time.time()
        
        # Make many concurrent requests
        tasks = []
        for i in range(200):
            if i % 2 == 0:
                tasks.append(make_chat_request(session, TEST_QUERIES[i % len(TEST_QUERIES)], f"stress_{i}"))
            else:
                tasks.append(make_deals_request(session, {"limit": 100, "min_score": 0}))
        
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        successful = sum(1 for success, _, _ in results if success)
        response_times = [rt for success, rt, _ in results if success]
        
        return {
            "total_requests": len(results),
            "successful": successful,
            "failed": len(results) - successful,
            "duration_seconds": elapsed,
            "requests_per_second": len(results) / elapsed,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
        }


async def run_database_query_test() -> Dict[str, Any]:
    """Test database query performance with various sizes"""
    print(f"\n{'='*60}")
    print("Database Query Performance Test")
    print(f"{'='*60}")
    
    results = {}
    async with aiohttp.ClientSession() as session:
        for limit in [10, 50, 100, 500, 1000]:
            print(f"Testing query with limit={limit}...")
            times = []
            
            for _ in range(10):  # 10 iterations for each size
                start = time.time()
                success, _, _ = await make_deals_request(session, {"limit": limit, "min_score": 0})
                elapsed = time.time() - start
                if success:
                    times.append(elapsed)
            
            if times:
                results[f"limit_{limit}"] = {
                    "avg_time": statistics.mean(times),
                    "min_time": min(times),
                    "max_time": max(times),
                    "median_time": statistics.median(times),
                }
    
    return results


def print_test_results(test_name: str, results: Dict[str, Any]):
    """Print formatted test results"""
    print(f"\n{'='*60}")
    print(f"Results: {test_name}")
    print(f"{'='*60}")
    print(json.dumps(results, indent=2))


async def main():
    """Run all tests"""
    print(f"\n{'#'*60}")
    print("PHASE 5: LOAD TESTING & STRESS TESTING")
    print(f"Target: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")
    
    all_results = {}
    
    # 1. Progressive Load Tests
    print("\n\n=== PROGRESSIVE LOAD TESTS ===")
    for users in [10, 50, 100]:  # Start with smaller loads
        test_name = f"load_test_{users}_users"
        results = await run_load_test(users, REQUESTS_PER_USER)
        all_results[test_name] = results
        print_test_results(test_name, results)
        await asyncio.sleep(2)  # Cool down between tests
    
    # 2. Cache Effectiveness Test
    print("\n\n=== CACHE EFFECTIVENESS TEST ===")
    cache_results = await run_cache_test()
    all_results["cache_test"] = cache_results
    print_test_results("cache_test", cache_results)
    
    # 3. Database Query Performance
    print("\n\n=== DATABASE QUERY PERFORMANCE ===")
    db_results = await run_database_query_test()
    all_results["database_queries"] = db_results
    print_test_results("database_queries", db_results)
    
    # 4. Stress Test
    print("\n\n=== STRESS TEST ===")
    stress_results = await run_stress_test()
    all_results["stress_test"] = stress_results
    print_test_results("stress_test", stress_results)
    
    # Final Summary
    print(f"\n\n{'#'*60}")
    print("TEST SUITE COMPLETE")
    print(f"{'#'*60}")
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_results_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n✅ Results saved to: {filename}")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for test_name, results in all_results.items():
        if "total_requests" in results:
            print(f"\n{test_name}:")
            print(f"  Total Requests: {results['total_requests']}")
            print(f"  Success Rate: {results.get('success_rate', 0):.1f}%")
            if "response_times" in results:
                print(f"  Avg Response: {results['response_times']['mean']*1000:.0f}ms")
                print(f"  P95 Response: {results['response_times']['p95']*1000:.0f}ms")
            if "requests_per_second" in results:
                print(f"  Throughput: {results['requests_per_second']:.1f} req/s")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
