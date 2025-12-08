"""
Price Watch Monitor Worker
Periodically checks price watches and sends alerts via WebSocket
"""

import asyncio
from datetime import datetime
from models.database import get_session, PriceWatch, Deal
from services.websocket_service import ws_service
from services.openai_service import generate_watch_alert
from config import config
import aiomysql


async def get_mysql_deal(deal_id: str):
    """Fetch deal from MySQL (for flight deals)"""
    if not deal_id.startswith('flight_'):
        return None
    
    try:
        conn = await aiomysql.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            db=config.DB_NAME
        )
        cursor = await conn.cursor(aiomysql.DictCursor)
        
        # Extract flight id from deal_id (flight_XXX -> XXX)
        flight_id = deal_id.replace('flight_', '')
        
        await cursor.execute(
            "SELECT id, flight_code as title, price, discount_percent FROM flights WHERE id = %s LIMIT 1",
            (flight_id,)
        )
        
        result = await cursor.fetchone()
        await cursor.close()
        conn.close()
        
        if result:
            return {
                'deal_id': deal_id,
                'title': result['title'],
                'price': float(result['price']),
                'type': 'flight',
                'discount_percent': result['discount_percent'] or 0
            }
    except Exception as e:
        print(f"   ⚠️ Error fetching from MySQL: {e}")
    
    return None


async def check_price_watches():
    """Check all active price watches and send alerts"""
    print("🔍 Checking price watches...")
    
    session = get_session()
    
    try:
        # Get all active watches
        watches = session.query(PriceWatch).filter(PriceWatch.active == True).all()
        
        if not watches:
            print("   No active watches")
            return
        
        print(f"   Found {len(watches)} active watches")
        alerts_sent = 0
        
        for watch in watches:
            try:
                # Get current deal info - try SQLite first
                deal = session.query(Deal).filter(Deal.deal_id == watch.deal_id).first()
                
                # If not in SQLite, try MySQL (for flight deals)
                if not deal:
                    deal = await get_mysql_deal(watch.deal_id)
                    if not deal:
                        print(f"   ⚠️ Deal {watch.deal_id} not found, deactivating watch")
                        watch.active = False
                        continue
                else:
                    # Convert SQLite Deal object to dict
                    deal = {
                        'deal_id': deal.deal_id,
                        'title': deal.title,
                        'price': deal.price,
                        'type': deal.type,
                        'discount_percent': getattr(deal, 'discount_percent', 0)
                    }
                
                alert_triggered = False
                alert_reasons = []
                
                # Check price threshold
                if watch.price_threshold and deal['price'] < watch.price_threshold:
                    alert_triggered = True
                    alert_reasons.append(f"Price dropped to ${deal['price']:.2f} (below ${watch.price_threshold:.2f})")
                
                # Check inventory threshold (mock for now - would come from metadata)
                inventory = 100  # Default high inventory for flight deals
                if watch.inventory_threshold and inventory < watch.inventory_threshold:
                    alert_triggered = True
                    alert_reasons.append(f"Only {inventory} units left (below {watch.inventory_threshold})")
                
                # Send alert if triggered
                if alert_triggered:
                    # Send WebSocket price alert using enhanced service
                    deal_data = {
                        "deal_id": deal['deal_id'],
                        "title": deal['title'],
                        "price": deal['price'],
                        "type": deal['type'],
                        "discount_percent": deal.get('discount_percent', 0)
                    }
                    alert_data = {
                        "reasons": alert_reasons,
                        "threshold": watch.price_threshold if watch.price_threshold else 0,
                        "new_price": deal['price']
                    }
                    await ws_service.send_price_alert(
                        watch.user_id,
                        watch.watch_id,
                        deal_data,
                        alert_data
                    )
                    
                    print(f"   🔔 Alert sent to {watch.user_id} for {deal['title']}")
                    alerts_sent += 1
                    
                    # Update last_notified timestamp
                    watch.last_notified = datetime.utcnow()
                
            except Exception as e:
                print(f"   ❌ Error checking watch {watch.watch_id}: {e}")
        
        session.commit()
        print(f"   ✅ Check complete - {alerts_sent} alerts sent")
        
    except Exception as e:
        print(f"❌ Error in watch check: {e}")
        session.rollback()
    finally:
        session.close()


async def start_watch_monitor():
    """Start periodic watch monitoring"""
    print("🚀 Starting price watch monitor...")
    
    while True:
        try:
            await check_price_watches()
            await asyncio.sleep(config.WATCH_CHECK_INTERVAL)  # Check every 30 seconds
        except Exception as e:
            print(f"❌ Watch monitor error: {e}")
            await asyncio.sleep(10)  # Retry after 10 seconds on error
