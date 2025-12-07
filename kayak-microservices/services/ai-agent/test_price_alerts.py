"""
Test Script: Trigger Price Alert Notification
This script will:
1. Get current deals from the database
2. Create a price watch with a high threshold
3. Update a deal price to be below the threshold
4. Wait for the watch monitor to detect it and send alert
"""

import requests
import time
import json
import subprocess

AI_AGENT_URL = "http://localhost:8000"

def get_active_deals():
    """Get deals from API"""
    response = requests.get(f"{AI_AGENT_URL}/api/ai/deals?limit=10")
    if response.status_code == 200:
        deals = response.json()
        return [(d['deal_id'], d['title'], d['price'], d['type']) for d in deals]
    return []

def create_price_watch(deal_id, current_price):
    """Create a price watch with threshold above current price"""
    # Set threshold to 110% of current price so it will alert when price stays same
    threshold = current_price * 1.10
    
    payload = {
        "user_id": "test_user_123",
        "deal_id": deal_id,
        "price_threshold": threshold,
        "inventory_threshold": 5
    }
    
    print(f"\\n📝 Creating watch for {deal_id}")
    print(f"   Current price: ${current_price:.2f}")
    print(f"   Threshold: ${threshold:.2f} (will alert if price drops below this)")
    
    response = requests.post(f"{AI_AGENT_URL}/api/ai/watch/create", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Watch created: {data['watch_id']}")
        return data['watch_id']
    else:
        print(f"   ❌ Failed to create watch: {response.text}")
        return None

def update_deal_price(deal_id, new_price):
    """Update deal price to trigger alert - Using Docker exec"""
    import subprocess
    
    # Update via Docker exec into the container
    cmd = [
        'docker', 'exec', 'kayak-ai-agent', 'python', '-c',
        f'from models.database import get_session, Deal; '
        f's = get_session(); '
        f'd = s.query(Deal).filter(Deal.deal_id == "{deal_id}").first(); '
        f'd.price = {new_price}; '
        f's.commit(); '
        f's.close(); '
        f'print("Updated {deal_id} to ${new_price:.2f}")'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(f"\\n💰 Updating {deal_id} price to ${new_price:.2f}")
    
    if result.returncode == 0:
        print(f"   ✅ {result.stdout.strip()}")
    else:
        print(f"   ❌ Failed: {result.stderr}")
    
    return result.returncode == 0

def check_websocket_connection():
    """Check if WebSocket is working"""
    print("\\n🔌 Testing WebSocket connection...")
    try:
        # Try to connect to WebSocket (will close immediately but tests connectivity)
        import websocket
        ws = websocket.create_connection(f"ws://localhost:8000/ws/events?user_id=test_user_123")
        ws.close()
        print("   ✅ WebSocket endpoint is accessible")
        return True
    except Exception as e:
        print(f"   ❌ WebSocket error: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 PRICE ALERT NOTIFICATION TEST")
    print("=" * 60)
    
    # 1. Check WebSocket
    check_websocket_connection()
    
    # 2. Get deals
    print("\\n📊 Getting active deals...")
    deals = get_active_deals()
    
    if not deals:
        print("   ❌ No active deals found")
        return
    
    for i, (deal_id, title, price, deal_type) in enumerate(deals[:3], 1):
        print(f"   {i}. {deal_id} - {title} - ${price:.2f}")
    
    # 3. Select first flight deal
    selected_deal = next((d for d in deals if d[3] == 'flight'), deals[0])
    deal_id, title, current_price, deal_type = selected_deal
    
    print(f"\\n🎯 Selected: {title} (${current_price:.2f})")
    
    # 4. Create watch
    watch_id = create_price_watch(deal_id, current_price)
    
    if not watch_id:
        return
    
    print("\\n⏳ Waiting for watch monitor cycle (30 seconds)...")
    time.sleep(5)
    
    # 5. Drop price below threshold to trigger alert
    new_price = current_price * 0.85  # Drop to 85% of current price
    update_deal_price(deal_id, new_price)
    
    print(f"\\n⏱️  Price dropped from ${current_price:.2f} to ${new_price:.2f}")
    print(f"   This is below threshold of ${current_price * 1.10:.2f}")
    print("\\n🔔 Alert should be sent within 30 seconds!")
    print("   Check:")
    print("   1. AI Mode page for notification banner (top-right)")
    print("   2. Chat for alert message")
    print("   3. Browser notification (if permission granted)")
    
    print("\\n📋 Instructions:")
    print("   1. Open http://localhost:5175/ai-mode in your browser")
    print("   2. Look for 🔔 notification in top-right corner")
    print("   3. Check chat messages for price alert")
    print("   4. Docker logs: docker-compose logs ai-agent | grep -i alert")
    
    print("\\n⏳ Waiting 35 seconds for next monitor cycle...")
    time.sleep(35)
    
    print("\\n✅ Test complete!")
    print("   If you didn't see a notification, check:")
    print("   - AI Agent logs: docker-compose logs ai-agent --tail 50")
    print("   - Browser console (F12) for WebSocket messages")
    print("   - Network tab for WebSocket connection status")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\\n\\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
