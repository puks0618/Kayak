"""
Hot Deal Monitor Worker
Detects and broadcasts hot deals to all connected users in real-time
"""

import asyncio
from datetime import datetime, timedelta
from typing import Set
from models.database import get_session, Deal
from services.websocket_service import ws_service
from config import config


class HotDealMonitor:
    """Monitors and broadcasts hot deals to connected users"""
    
    def __init__(self):
        self.seen_deals: Set[str] = set()  # Track deals already broadcast
        self.last_check = datetime.utcnow()
    
    async def check_and_broadcast_hot_deals(self):
        """Check for new hot deals and broadcast them"""
        print("🔥 Checking for hot deals...")
        
        session = get_session()
        
        try:
            # Only check if there are connected users
            connection_count = ws_service.get_connection_count()
            if connection_count == 0:
                print("   No connected users, skipping check")
                return
            
            print(f"   Broadcasting to {connection_count} connected users")
            
            # Query for hot deals (high savings, recent)
            # Hot deal criteria:
            # 1. Savings > 30% OR discount > $200
            # 2. Created/updated in last hour
            # 3. Not already broadcast
            
            cutoff_time = datetime.utcnow() - timedelta(hours=1)
            
            hot_deals = session.query(Deal).filter(
                Deal.created_at >= cutoff_time,
                # High savings or high discount
                (Deal.metadata.contains('"savings_percent"') | 
                 Deal.metadata.contains('"discount"'))
            ).order_by(Deal.created_at.desc()).limit(10).all()
            
            broadcast_count = 0
            
            for deal in hot_deals:
                # Skip if already broadcast
                if deal.deal_id in self.seen_deals:
                    continue
                
                # Check if it meets hot deal criteria
                metadata = deal.get_metadata()
                savings_percent = metadata.get('savings_percent', 0)
                discount = metadata.get('discount', 0)
                
                is_hot = savings_percent > 30 or discount > 200
                
                if is_hot:
                    # Broadcast to all connected users
                    await ws_service.broadcast_hot_deal(
                        deal.deal_id,
                        deal.title,
                        deal.price,
                        deal.category,
                        savings_percent,
                        discount,
                        metadata
                    )
                    
                    # Mark as seen
                    self.seen_deals.add(deal.deal_id)
                    broadcast_count += 1
                    
                    print(f"   🔥 Broadcast hot deal: {deal.title} "
                          f"(${deal.price:.2f}, {savings_percent:.1f}% off)")
            
            # Clean up old seen deals (keep last 1000)
            if len(self.seen_deals) > 1000:
                self.seen_deals = set(list(self.seen_deals)[-1000:])
            
            if broadcast_count > 0:
                print(f"   ✅ Broadcast {broadcast_count} hot deals")
            else:
                print("   No new hot deals found")
            
        except Exception as e:
            print(f"❌ Error checking hot deals: {e}")
        finally:
            session.close()
    
    async def scan_for_trending_deals(self):
        """Scan for trending deals (deals getting lots of views/watches)"""
        print("📈 Scanning for trending deals...")
        
        session = get_session()
        
        try:
            # Get deals with most price watches (indicating high interest)
            # This would need a proper join query in production
            from models.database import PriceWatch
            
            # Count watches per deal
            from sqlalchemy import func
            trending = session.query(
                Deal,
                func.count(PriceWatch.watch_id).label('watch_count')
            ).join(
                PriceWatch, Deal.deal_id == PriceWatch.deal_id
            ).group_by(
                Deal.deal_id
            ).having(
                func.count(PriceWatch.watch_id) >= 3  # At least 3 people watching
            ).order_by(
                func.count(PriceWatch.watch_id).desc()
            ).limit(5).all()
            
            for deal, watch_count in trending:
                if deal.deal_id not in self.seen_deals:
                    metadata = deal.get_metadata()
                    
                    # Broadcast trending deal
                    await ws_service.send_deal_alert(
                        "all",  # Broadcast to all users
                        deal.deal_id,
                        deal.title,
                        deal.price,
                        deal.category,
                        metadata,
                        alert_type="trending",
                        extra_info={"watch_count": watch_count}
                    )
                    
                    self.seen_deals.add(deal.deal_id)
                    
                    print(f"   📈 Broadcast trending deal: {deal.title} "
                          f"({watch_count} watchers)")
            
        except Exception as e:
            print(f"❌ Error scanning trending deals: {e}")
        finally:
            session.close()


# Global monitor instance
hot_deal_monitor = HotDealMonitor()


async def start_hot_deal_monitor():
    """Start periodic hot deal monitoring"""
    print("🚀 Starting hot deal monitor...")
    
    check_count = 0
    
    while True:
        try:
            # Check for hot deals every 60 seconds
            await hot_deal_monitor.check_and_broadcast_hot_deals()
            
            # Check for trending deals every 5 minutes
            check_count += 1
            if check_count % 5 == 0:
                await hot_deal_monitor.scan_for_trending_deals()
            
            await asyncio.sleep(60)  # 60 seconds between checks
            
        except Exception as e:
            print(f"❌ Error in hot deal monitor: {e}")
            await asyncio.sleep(60)
