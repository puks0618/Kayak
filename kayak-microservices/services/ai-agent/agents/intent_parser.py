"""
Intent Parser Agent
Analyzes user queries to determine intent
"""

from models.schemas import UserQuery

class IntentParser:
    def __init__(self):
        self.intents = {
            'book': ['book', 'reserve', 'buy'],
            'search': ['find', 'search', 'show', 'looking for'],
            'cancel': ['cancel', 'refund'],
            'status': ['status', 'check']
        }

    async def parse(self, query: UserQuery) -> dict:
        """
        Parse the user query and return intent and entities
        """
        text = query.query.lower()
        detected_intent = 'unknown'
        
        for intent, keywords in self.intents.items():
            if any(keyword in text for keyword in keywords):
                detected_intent = intent
                break
        
        return {
            'confidence': 0.0
        }
    
    def extract_entities(self, user_query):
        """Extract entities from query"""
        # TODO: Extract dates, locations, preferences
        return {}

