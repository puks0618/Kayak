"""
Deal Detector Agent
Identifies deals from listing data based on price history and scoring rules
"""

from typing import Dict, List
from datetime import datetime, timedelta
from models.database import get_session, Deal, PriceHistory
from config import config
import statistics

class DealDetector:
    """Detects deals based on price drops, inventory, and scoring rules"""
    
    def __init__(self):
        self.price_drop_threshold = config.DEAL_PRICE_DROP_THRESHOLD
        self.inventory_threshold = config.DEAL_INVENTORY_THRESHOLD
        self.min_score = config.DEAL_SCORE_MIN
    
    def calculate_deal_score(self, listing: Dict) -> int:
        """
        Calculate deal score (0-100) based on multiple factors
        
        Scoring breakdown:
        - Price comparison (40 points max)
        - Inventory scarcity (25 points max)
        - Time urgency (20 points max)
        - Amenity bonuses (15 points max)
        """
        score = 0
        
        # 1. Price Score (40 points)
        price = listing.get('price', 0)
        original_price = listing.get('original_price', price)
        
        if original_price > 0:
            discount_pct = ((original_price - price) / original_price) * 100
            if discount_pct >= 30:
                score += 40
            elif discount_pct >= 20:
                score += 30
            elif discount_pct >= 15:
                score += 20
            elif discount_pct >= 10:
                score += 10
        
        # 2. Inventory Scarcity Score (25 points)
        inventory = listing.get('available_inventory', 100)
        if inventory <= 3:
            score += 25
        elif inventory <= 5:
            score += 20
        elif inventory <= 10:
            score += 15
        elif inventory <= 20:
            score += 10
        
        # 3. Time Urgency Score (20 points)
        expires_at = listing.get('expires_at')
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                except:
                    expires_at = None
            
            if expires_at:
                hours_left = (expires_at - datetime.utcnow()).total_seconds() / 3600
                if hours_left <= 24:
                    score += 20
                elif hours_left <= 48:
                    score += 15
                elif hours_left <= 72:
                    score += 10
        
        # 4. Amenity Bonus Score (15 points)
        amenities = listing.get('amenities', [])
        tags = listing.get('tags', [])
        
        bonus_features = [
            'refundable', 'free-cancellation', 'pet-friendly',
            'near-transit', 'breakfast-included', 'free-wifi',
            'airport-shuttle', 'non-stop'
        ]
        
        all_features = amenities + tags
        matched_features = sum(1 for f in bonus_features if any(f in str(a).lower() for a in all_features))
        score += min(15, matched_features * 3)
        
        # 5. Value Score - Better prices get higher scores (20 points bonus)
        deal_type = listing.get('type', '')
        if deal_type == 'hotel':
            # Hotels: Lower price per night = better deal
            if price < 100:
                score += 20
            elif price < 150:
                score += 15
            elif price < 200:
                score += 10
            elif price < 300:
                score += 5
            
            # Rating bonus (10 points)
            rating = listing.get('metadata', {}).get('rating', 0) if isinstance(listing.get('metadata'), dict) else 0
            if rating >= 4.5:
                score += 10
            elif rating >= 4.0:
                score += 7
            elif rating >= 3.5:
                score += 5
                
        elif deal_type == 'flight':
            # Flights: Lower price = better deal
            if price < 200:
                score += 20
            elif price < 350:
                score += 15
            elif price < 500:
                score += 10
            elif price < 700:
                score += 5
        
        return min(100, score)
    
    def is_deal(self, listing: Dict, threshold: int = None) -> bool:
        """Check if listing qualifies as a deal"""
        threshold = threshold or self.min_score
        score = self.calculate_deal_score(listing)
        return score >= threshold
    
    def check_price_history(self, deal_id: str, current_price: float) -> Dict:
        """
        Check price history for this deal
        
        Returns:
            {
                'avg_30_day': float,
                'min_price': float,
                'max_price': float,
                'percent_below_avg': float
            }
        """
        session = get_session()
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        history = session.query(PriceHistory).filter(
            PriceHistory.deal_id == deal_id,
            PriceHistory.recorded_at >= thirty_days_ago
        ).all()
        
        if not history:
            return {
                'avg_30_day': current_price,
                'min_price': current_price,
                'max_price': current_price,
                'percent_below_avg': 0.0
            }
        
        prices = [h.price for h in history]
        avg_price = statistics.mean(prices)
        percent_below = ((avg_price - current_price) / avg_price) * 100 if avg_price > 0 else 0
        
        return {
            'avg_30_day': avg_price,
            'min_price': min(prices),
            'max_price': max(prices),
            'percent_below_avg': percent_below
        }
    
    def detect_deals_from_batch(self, listings: List[Dict]) -> List[Dict]:
        """
        Process a batch of listings and return those that qualify as deals
        
        Args:
            listings: List of listing dicts
            
        Returns:
            List of deals with scores
        """
        deals = []
        
        for listing in listings:
            score = self.calculate_deal_score(listing)
            
            if score >= self.min_score:
                deal = {
                    **listing,
                    'score': score,
                    'is_deal': True
                }
                deals.append(deal)
        
        # Sort by score descending
        deals.sort(key=lambda x: x['score'], reverse=True)
        
        return deals
    
    async def process_normalized_deal(self, deal_data: Dict):
        """
        Process a normalized deal from Kafka and score it
        
        This is called by the Kafka consumer
        """
        score = self.calculate_deal_score(deal_data)
        
        if score >= self.min_score:
            deal_data['score'] = score
            deal_data['scored_at'] = datetime.utcnow().isoformat()
            
            # Will be published to deals.scored topic by the worker
            return deal_data
        
        return None

