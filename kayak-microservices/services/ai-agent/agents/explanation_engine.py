"""
Price History Analysis & Deal Explanation Engine
Tracks price trends and generates intelligent explanations
"""

import sqlite3
import json
import statistics
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class PriceTrend:
    """Price trend analysis result"""
    current_price: float
    avg_price_7d: Optional[float]
    avg_price_30d: Optional[float]
    avg_price_60d: Optional[float]
    min_price_60d: Optional[float]
    max_price_60d: Optional[float]
    trend: str  # "falling", "rising", "stable", "volatile"
    trend_percentage: float
    recommendation: str


class PriceAnalyzer:
    """Analyzes price history and trends"""
    
    def __init__(self, db_path: str = "./data/kayak_ai.db"):
        self.db_path = db_path
    
    def _get_price_history(self, deal_id: str, days: int = 60) -> List[Tuple[datetime, float]]:
        """Get price history for a deal"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        cursor.execute("""
            SELECT recorded_at, price
            FROM price_history
            WHERE deal_id = ?
            AND recorded_at >= ?
            ORDER BY recorded_at DESC
        """, (deal_id, cutoff_date.isoformat()))
        
        history = [(datetime.fromisoformat(row[0]), row[1]) for row in cursor.fetchall()]
        conn.close()
        
        return history
    
    def analyze_trend(self, deal_id: str, current_price: float) -> PriceTrend:
        """Analyze price trend for a deal"""
        history = self._get_price_history(deal_id, 60)
        
        if not history:
            # No history, return current data only
            return PriceTrend(
                current_price=current_price,
                avg_price_7d=None,
                avg_price_30d=None,
                avg_price_60d=None,
                min_price_60d=None,
                max_price_60d=None,
                trend="unknown",
                trend_percentage=0.0,
                recommendation="New deal - no historical data available"
            )
        
        # Split into time periods
        now = datetime.utcnow()
        prices_7d = [p for dt, p in history if (now - dt).days <= 7]
        prices_30d = [p for dt, p in history if (now - dt).days <= 30]
        prices_60d = [p for dt, p in history]
        
        # Calculate averages
        avg_7d = statistics.mean(prices_7d) if prices_7d else None
        avg_30d = statistics.mean(prices_30d) if prices_30d else None
        avg_60d = statistics.mean(prices_60d) if prices_60d else None
        
        # Min/max
        min_60d = min(prices_60d) if prices_60d else None
        max_60d = max(prices_60d) if prices_60d else None
        
        # Determine trend
        trend = "stable"
        trend_pct = 0.0
        
        if avg_7d and avg_30d:
            trend_pct = ((current_price - avg_30d) / avg_30d) * 100
            
            if trend_pct < -5:
                trend = "falling"
            elif trend_pct > 5:
                trend = "rising"
            elif len(prices_30d) >= 10:
                # Check volatility
                std_dev = statistics.stdev(prices_30d)
                if std_dev > (avg_30d * 0.15):  # >15% volatility
                    trend = "volatile"
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            current_price, avg_30d, min_60d, max_60d, trend
        )
        
        return PriceTrend(
            current_price=current_price,
            avg_price_7d=avg_7d,
            avg_price_30d=avg_30d,
            avg_price_60d=avg_60d,
            min_price_60d=min_60d,
            max_price_60d=max_60d,
            trend=trend,
            trend_percentage=trend_pct,
            recommendation=recommendation
        )
    
    def _generate_recommendation(
        self,
        current: float,
        avg_30d: Optional[float],
        min_60d: Optional[float],
        max_60d: Optional[float],
        trend: str
    ) -> str:
        """Generate booking recommendation"""
        if not avg_30d or not min_60d:
            return "Book now - new deal with limited history"
        
        # Calculate position in price range
        if max_60d and max_60d > min_60d:
            position = (current - min_60d) / (max_60d - min_60d)
        else:
            position = 0.5
        
        if current <= min_60d * 1.05:  # Within 5% of 60-day low
            return "Excellent price! Book now - lowest in 60 days"
        elif position < 0.3 and trend != "rising":
            return "Great price! Book soon - well below average"
        elif position < 0.5 and trend == "falling":
            return "Good price and falling - consider waiting a few days"
        elif position < 0.5:
            return "Fair price - below average"
        elif position > 0.7 and trend == "rising":
            return "Price rising - book now to avoid increases"
        elif position > 0.8:
            return "High price - consider waiting for a better deal"
        else:
            return "Average price - monitor for better deals"
    
    def compare_deals(self, deal1: Dict, deal2: Dict) -> str:
        """Compare two deals and explain the better choice"""
        price1 = deal1.get('price', 0)
        price2 = deal2.get('price', 0)
        score1 = deal1.get('score', 0)
        score2 = deal2.get('score', 0)
        
        # Analyze trends
        trend1 = self.analyze_trend(deal1.get('deal_id', ''), price1)
        trend2 = self.analyze_trend(deal2.get('deal_id', ''), price2)
        
        reasons = []
        
        # Price comparison
        if price1 < price2:
            savings = price2 - price1
            pct = (savings / price2) * 100
            reasons.append(f"${savings:.0f} cheaper ({pct:.0f}% less)")
        elif price2 < price1:
            savings = price1 - price2
            pct = (savings / price1) * 100
            reasons.append(f"${savings:.0f} more expensive ({pct:.0f}% premium)")
        
        # Score comparison
        if score1 > score2:
            reasons.append(f"Higher deal score ({score1} vs {score2})")
        elif score2 > score1:
            reasons.append(f"Lower deal score ({score1} vs {score2})")
        
        # Trend comparison
        if trend1.trend == "falling" and trend2.trend != "falling":
            reasons.append("Price is falling (may drop further)")
        elif trend1.trend == "rising" and trend2.trend != "rising":
            reasons.append("Price is rising (book soon)")
        
        # Historical comparison
        if trend1.avg_price_30d and trend2.avg_price_30d:
            if price1 < trend1.avg_price_30d and price2 >= trend2.avg_price_30d:
                reasons.append("Below 30-day average (good value)")
        
        winner = "Deal 1" if score1 > score2 or (score1 == score2 and price1 < price2) else "Deal 2"
        
        return f"{winner} is better: " + ", ".join(reasons) if reasons else "Deals are comparable"


class ExplanationEngine:
    """Generates natural language explanations for deals"""
    
    def __init__(self, db_path: str = "/tmp/kayak_ai.db"):
        self.analyzer = PriceAnalyzer(db_path)
    
    def explain_deal(self, deal: Dict, context: str = "general") -> str:
        """Generate comprehensive explanation for a deal"""
        deal_type = deal.get('type', 'unknown')
        price = deal.get('price', 0)
        original_price = deal.get('original_price', price)
        discount_pct = deal.get('discount_percent', 0)
        score = deal.get('score', 0)
        
        # Analyze price trend
        trend = self.analyzer.analyze_trend(deal.get('deal_id', ''), price)
        
        # Build explanation
        parts = []
        
        # 1. Deal quality assessment
        if score >= 90:
            parts.append("⭐ **Exceptional Deal**")
        elif score >= 80:
            parts.append("🔥 **Hot Deal**")
        elif score >= 70:
            parts.append("✨ **Good Deal**")
        else:
            parts.append("💡 **Standard Offer**")
        
        # 2. Savings information
        if discount_pct > 0:
            savings = original_price - price
            parts.append(f"Save ${savings:.0f} ({discount_pct:.0f}% off)")
        
        # 3. Price trend analysis
        if trend.trend != "unknown":
            parts.append(self._explain_trend(trend))
        
        # 4. Recommendation
        parts.append(f"📊 {trend.recommendation}")
        
        # 5. Deal-specific insights
        if deal_type == "flight":
            parts.append(self._explain_flight(deal))
        elif deal_type == "hotel":
            parts.append(self._explain_hotel(deal))
        
        return " | ".join(parts)
    
    def _explain_trend(self, trend: PriceTrend) -> str:
        """Explain price trend"""
        if trend.trend == "falling":
            return f"📉 Price falling ({abs(trend.trend_percentage):.1f}% below recent average)"
        elif trend.trend == "rising":
            return f"📈 Price rising ({trend.trend_percentage:.1f}% above recent average)"
        elif trend.trend == "volatile":
            return "⚡ Volatile pricing (book when low)"
        else:
            return "➡️ Stable pricing"
    
    def _explain_flight(self, deal: Dict) -> str:
        """Explain flight-specific features"""
        metadata = deal.get('metadata', {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        features = []
        
        stops = metadata.get('stops', 1)
        if stops == 0:
            features.append("Direct flight")
        
        if metadata.get('refundable'):
            features.append("Refundable")
        
        cabin = metadata.get('cabin_class', 'Economy')
        if cabin != 'Economy':
            features.append(cabin)
        
        return " • ".join(features) if features else "Standard flight"
    
    def _explain_hotel(self, deal: Dict) -> str:
        """Explain hotel-specific features"""
        metadata = deal.get('metadata', {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        features = []
        
        rating = metadata.get('rating', 0)
        if rating >= 4.5:
            features.append(f"{rating}⭐ Excellent")
        elif rating >= 4.0:
            features.append(f"{rating}⭐ Very Good")
        
        if metadata.get('breakfast_included'):
            features.append("Breakfast included")
        
        if "Free cancellation" in metadata.get('cancellation_policy', ''):
            features.append("Free cancellation")
        
        return " • ".join(features) if features else "Standard hotel"
    
    def explain_trip_bundle(self, bundle: Dict) -> str:
        """Explain why a trip bundle is recommended"""
        flight = bundle.get('flight', {})
        hotel = bundle.get('hotel', {})
        total_cost = bundle.get('total_cost', 0)
        fit_score = bundle.get('fit_score', 0)
        
        parts = []
        
        # Overall assessment
        if fit_score >= 90:
            parts.append("🎯 **Perfect Match** for your preferences")
        elif fit_score >= 80:
            parts.append("✨ **Excellent Match** for your needs")
        elif fit_score >= 70:
            parts.append("👍 **Good Match** for your budget")
        else:
            parts.append("💡 **Available Option** within budget")
        
        # Budget fit
        parts.append(f"Total: ${total_cost:.0f}")
        
        # Flight highlights
        flight_price = flight.get('price', 0)
        parts.append(f"Flight ${flight_price:.0f}")
        
        # Hotel highlights
        hotel_price = hotel.get('price_per_night', 0) if isinstance(hotel.get('price_per_night'), (int, float)) else hotel.get('price', 0)
        parts.append(f"Hotel ${hotel_price:.0f}/night")
        
        return " | ".join(parts)
    
    def explain_price_alert(self, deal: Dict, threshold: float) -> str:
        """Generate explanation for price alert"""
        current_price = deal.get('price', 0)
        savings = threshold - current_price
        pct = (savings / threshold) * 100
        
        trend = self.analyzer.analyze_trend(deal.get('deal_id', ''), current_price)
        
        parts = [
            f"🔔 Price Alert!",
            f"${current_price:.0f} (${savings:.0f} below your ${threshold:.0f} threshold)",
        ]
        
        if trend.min_price_60d and current_price <= trend.min_price_60d * 1.05:
            parts.append("📊 Lowest price in 60 days!")
        
        if trend.trend == "falling":
            parts.append("📉 Price is falling - may drop more")
        elif trend.trend == "rising":
            parts.append("📈 Price rising - book now")
        
        return " | ".join(parts)


def generate_deal_insights(deal: Dict, competitors: List[Dict] = None) -> Dict[str, Any]:
    """Generate comprehensive insights for a deal"""
    engine = ExplanationEngine()
    
    insights = {
        "explanation": engine.explain_deal(deal),
        "price_analysis": None,
        "comparison": None,
        "recommendation": None
    }
    
    # Price trend analysis
    trend = engine.analyzer.analyze_trend(deal.get('deal_id', ''), deal.get('price', 0))
    insights["price_analysis"] = {
        "current": trend.current_price,
        "avg_30d": trend.avg_price_30d,
        "min_60d": trend.min_price_60d,
        "max_60d": trend.max_price_60d,
        "trend": trend.trend,
        "trend_percentage": trend.trend_percentage
    }
    insights["recommendation"] = trend.recommendation
    
    # Comparison with competitors
    if competitors:
        comparisons = []
        for comp in competitors[:3]:  # Top 3 competitors
            comparison = engine.analyzer.compare_deals(deal, comp)
            comparisons.append({
                "competitor": comp.get('title', 'Unknown'),
                "analysis": comparison
            })
        insights["comparison"] = comparisons
    
    return insights
