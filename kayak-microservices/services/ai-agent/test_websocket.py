"""
WebSocket Test Client
Tests real-time features: connections, messages, deal alerts, price alerts, trip updates
"""

import asyncio
import json
import websockets
from datetime import datetime
import aiohttp
from typing import List, Dict
import sys


class WebSocketTestClient:
    """Test client for WebSocket real-time features"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.ws_url = base_url.replace("http", "ws")
        self.connections: List[websockets.WebSocketClientProtocol] = []
        self.received_messages: Dict[str, List] = {}
    
    async def connect_user(self, user_id: str) -> websockets.WebSocketClientProtocol:
        """Connect a user to WebSocket"""
        uri = f"{self.ws_url}/ws/events?user_id={user_id}"
        print(f"🔌 Connecting user {user_id} to {uri}")
        
        ws = await websockets.connect(uri)
        self.connections.append(ws)
        self.received_messages[user_id] = []
        
        print(f"✅ User {user_id} connected")
        return ws
    
    async def listen_for_messages(self, ws: websockets.WebSocketClientProtocol, user_id: str, duration: int = 10):
        """Listen for messages for a specified duration"""
        print(f"👂 Listening for messages for user {user_id} ({duration}s)")
        
        try:
            end_time = asyncio.get_event_loop().time() + duration
            
            while asyncio.get_event_loop().time() < end_time:
                try:
                    # Wait with timeout
                    message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    self.received_messages[user_id].append(data)
                    
                    msg_type = data.get('type', 'unknown')
                    print(f"📨 {user_id} received [{msg_type}]: {json.dumps(data, indent=2)[:200]}")
                    
                except asyncio.TimeoutError:
                    # No message received in timeout period, continue
                    continue
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON: {e}")
                    
        except Exception as e:
            print(f"❌ Error listening: {e}")
    
    async def send_message(self, ws: websockets.WebSocketClientProtocol, message: dict, user_id: str):
        """Send a message to WebSocket"""
        print(f"📤 {user_id} sending: {message}")
        await ws.send(json.dumps(message))
    
    async def test_basic_connection(self):
        """Test 1: Basic connection and ping/pong"""
        print("\n" + "="*60)
        print("TEST 1: Basic Connection and Heartbeat")
        print("="*60)
        
        user_id = "test_user_1"
        ws = await self.connect_user(user_id)
        
        # Wait for welcome message
        await asyncio.sleep(1)
        
        # Send ping
        await self.send_message(ws, {"type": "ping"}, user_id)
        
        # Listen for pong
        await self.listen_for_messages(ws, user_id, 3)
        
        # Check results
        messages = self.received_messages[user_id]
        pong_received = any(msg.get('type') == 'pong' for msg in messages)
        welcome_received = any(msg.get('type') == 'notification' for msg in messages)
        
        print(f"\n📊 Test Results:")
        print(f"   Welcome message: {'✅' if welcome_received else '❌'}")
        print(f"   Pong received: {'✅' if pong_received else '❌'}")
        print(f"   Total messages: {len(messages)}")
        
        await ws.close()
        return welcome_received and pong_received
    
    async def test_channel_subscription(self):
        """Test 2: Channel subscription"""
        print("\n" + "="*60)
        print("TEST 2: Channel Subscription")
        print("="*60)
        
        user_id = "test_user_2"
        ws = await self.connect_user(user_id)
        
        await asyncio.sleep(1)
        
        # Subscribe to deals channel
        await self.send_message(ws, {
            "type": "subscribe",
            "channel": "hot_deals"
        }, user_id)
        
        await asyncio.sleep(1)
        
        # Unsubscribe
        await self.send_message(ws, {
            "type": "unsubscribe",
            "channel": "hot_deals"
        }, user_id)
        
        await self.listen_for_messages(ws, user_id, 2)
        
        messages = self.received_messages[user_id]
        subscribe_confirm = any(
            msg.get('type') == 'notification' and 'Subscribed' in msg.get('message', '')
            for msg in messages
        )
        
        print(f"\n📊 Test Results:")
        print(f"   Subscription confirmed: {'✅' if subscribe_confirm else '❌'}")
        
        await ws.close()
        return subscribe_confirm
    
    async def test_statistics_request(self):
        """Test 3: Statistics request"""
        print("\n" + "="*60)
        print("TEST 3: Statistics Request")
        print("="*60)
        
        user_id = "test_user_3"
        ws = await self.connect_user(user_id)
        
        await asyncio.sleep(1)
        
        # Request stats
        await self.send_message(ws, {"type": "get_stats"}, user_id)
        
        await self.listen_for_messages(ws, user_id, 3)
        
        messages = self.received_messages[user_id]
        stats_received = any(msg.get('type') == 'stats' for msg in messages)
        
        print(f"\n📊 Test Results:")
        print(f"   Stats received: {'✅' if stats_received else '❌'}")
        
        if stats_received:
            stats_msg = next(msg for msg in messages if msg.get('type') == 'stats')
            print(f"   Stats data: {json.dumps(stats_msg.get('data', {}), indent=2)}")
        
        await ws.close()
        return stats_received
    
    async def test_multiple_connections(self):
        """Test 4: Multiple simultaneous connections"""
        print("\n" + "="*60)
        print("TEST 4: Multiple Simultaneous Connections")
        print("="*60)
        
        # Connect 5 users
        users = [f"user_{i}" for i in range(5)]
        connections = []
        
        for user_id in users:
            ws = await self.connect_user(user_id)
            connections.append((user_id, ws))
        
        # Let them all receive welcome messages
        await asyncio.sleep(2)
        
        # Send ping from each
        for user_id, ws in connections:
            await self.send_message(ws, {"type": "ping"}, user_id)
        
        # Listen for responses
        listen_tasks = [
            self.listen_for_messages(ws, user_id, 3)
            for user_id, ws in connections
        ]
        await asyncio.gather(*listen_tasks)
        
        # Close all
        for _, ws in connections:
            await ws.close()
        
        # Check results
        all_received = all(
            len(self.received_messages.get(user_id, [])) > 0
            for user_id in users
        )
        
        print(f"\n📊 Test Results:")
        print(f"   All users received messages: {'✅' if all_received else '❌'}")
        for user_id in users:
            count = len(self.received_messages.get(user_id, []))
            print(f"   {user_id}: {count} messages")
        
        return all_received
    
    async def test_price_watch_alert(self):
        """Test 5: Create price watch and receive alert"""
        print("\n" + "="*60)
        print("TEST 5: Price Watch Alert")
        print("="*60)
        
        user_id = "test_user_watch"
        ws = await self.connect_user(user_id)
        
        await asyncio.sleep(1)
        
        # Create a price watch via REST API
        async with aiohttp.ClientSession() as session:
            watch_data = {
                "user_id": user_id,
                "deal_id": "deal_1",  # Existing deal
                "price_threshold": 9999,  # Very high threshold to trigger alert
                "inventory_threshold": None
            }
            
            print(f"📝 Creating price watch: {watch_data}")
            
            async with session.post(
                f"{self.base_url}/api/price-watch",
                json=watch_data
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✅ Price watch created: {result}")
                else:
                    print(f"❌ Failed to create watch: {await resp.text()}")
                    await ws.close()
                    return False
        
        # Listen for price alerts
        print("👂 Listening for price alerts...")
        await self.listen_for_messages(ws, user_id, 5)
        
        messages = self.received_messages[user_id]
        alert_received = any(msg.get('type') == 'price_alert' for msg in messages)
        
        print(f"\n📊 Test Results:")
        print(f"   Price alert received: {'✅' if alert_received else '❌'}")
        
        if alert_received:
            alert = next(msg for msg in messages if msg.get('type') == 'price_alert')
            print(f"   Alert details: {json.dumps(alert, indent=2)}")
        
        await ws.close()
        return alert_received
    
    async def test_rest_endpoints(self):
        """Test 6: REST endpoints for WebSocket stats"""
        print("\n" + "="*60)
        print("TEST 6: REST Endpoints")
        print("="*60)
        
        # Connect a few users
        users = [f"rest_test_user_{i}" for i in range(3)]
        connections = []
        
        for user_id in users:
            ws = await self.connect_user(user_id)
            connections.append(ws)
        
        await asyncio.sleep(1)
        
        async with aiohttp.ClientSession() as session:
            # Test stats endpoint
            async with session.get(f"{self.base_url}/api/websocket/stats") as resp:
                stats = await resp.json()
                print(f"📊 WebSocket Stats: {json.dumps(stats, indent=2)}")
            
            # Test connections endpoint
            async with session.get(f"{self.base_url}/api/websocket/connections") as resp:
                connections_info = await resp.json()
                print(f"🔌 Active Connections: {json.dumps(connections_info, indent=2)}")
        
        # Close all
        for ws in connections:
            await ws.close()
        
        return stats.get('total_connections', 0) >= 3
    
    async def run_all_tests(self):
        """Run all WebSocket tests"""
        print("\n" + "🚀"*30)
        print("WEBSOCKET TEST SUITE")
        print("🚀"*30)
        
        tests = [
            ("Basic Connection", self.test_basic_connection),
            ("Channel Subscription", self.test_channel_subscription),
            ("Statistics Request", self.test_statistics_request),
            ("Multiple Connections", self.test_multiple_connections),
            ("Price Watch Alert", self.test_price_watch_alert),
            ("REST Endpoints", self.test_rest_endpoints),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results[test_name] = result
            except Exception as e:
                print(f"\n❌ Test '{test_name}' failed with error: {e}")
                results[test_name] = False
            
            await asyncio.sleep(1)
        
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
        
        return results


async def main():
    """Run WebSocket tests"""
    client = WebSocketTestClient()
    
    try:
        await client.run_all_tests()
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
