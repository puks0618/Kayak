"""
Explainer Agent
Provides explanations for AI decisions using OpenAI
"""

from typing import Dict
from services.openai_service import generate_explanation, generate_watch_alert, compare_deals
from config import config

class ExplainerAgent:
    """Generate explanations for deals and recommendations"""
    
    def __init__(self):
        self.max_words = config.EXPLANATION_MAX_WORDS
        self.alert_max_words = config.WATCH_ALERT_MAX_WORDS
    
    async def explain_deal(self, deal: Dict, user_context: Dict) -> str:
        """Generate explanation for why a deal is good"""
        explanation = await generate_explanation(deal, user_context, self.max_words)
        return explanation
    
    async def explain_recommendation(self, bundle: Dict, user_context: Dict) -> str:
        """Explain why a trip bundle is recommended"""
        deal_info = {
            'type': 'bundle',
            'price': bundle.get('total_cost'),
            'original_price': bundle.get('flight', {}).get('price', 0) * 1.2 + bundle.get('hotel', {}).get('total_price', 0) * 1.2,
            'discount_percent': 15,
            'tags': bundle.get('flight', {}).get('tags', []) + bundle.get('hotel', {}).get('tags', [])
        }
        return await generate_explanation(deal_info, user_context, self.max_words)
    
    async def explain_price_change(self, change_data: Dict) -> str:
        """Generate alert for price/inventory changes"""
        return await generate_watch_alert(change_data, self.alert_max_words)
    
    async def compare_options(self, deals: list, user_context: Dict) -> str:
        """Compare multiple deals"""
        return await compare_deals(deals, user_context)

