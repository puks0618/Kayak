"""
Intent Parser Agent
Analyzes user queries using OpenAI to determine intent and extract entities
"""

from typing import Dict, List, Optional
from services.openai_service import parse_intent, refine_search
from models.database import get_session, Conversation
from datetime import datetime

class IntentParser:
    """Parse user intents using OpenAI GPT-4"""
    
    def __init__(self):
        pass
    
    async def parse(self, user_id: str, message: str, conversation_history: Optional[List[Dict]] = None) -> Dict:
        """
        Parse the user query and return intent and entities using OpenAI
        
        Args:
            user_id: User identifier
            message: User message
            conversation_history: Previous conversation messages
            
        Returns:
            {
                'intent': str,
                'entities': dict,
                'confidence': float
            }
        """
        try:
            # Use OpenAI/Ollama to parse intent
            result = await parse_intent(message, conversation_history)
            
            # Validate the result - if origin/destination looks wrong, use fallback
            entities = result.get('entities', {})
            origin = entities.get('origin', '')
            destination = entities.get('destination', '')
            
            # Check if origin/destination contains invalid patterns (e.g., whole sentences)
            invalid_patterns = ['FIND', 'FLIGHT', 'FROM', 'NEED', 'TRIP', 'PLEASE']
            if any(pattern in origin.upper() for pattern in invalid_patterns) or \
               any(pattern in destination.upper() for pattern in invalid_patterns) or \
               len(origin) > 20 or len(destination) > 20:
                print(f"⚠️ Ollama returned invalid entities (origin={origin}, dest={destination}), using fallback")
                result = self._fallback_parse(message)
        except Exception as e:
            print(f"⚠️ OpenAI/Ollama parsing failed: {e}, using fallback")
            # Fallback: Simple keyword-based parsing
            result = self._fallback_parse(message)
        
        # Store in conversation history
        session = get_session()
        conv = Conversation(
            user_id=user_id,
            message=message,
            response="",  # Will be filled later
            intent=result.get('intent', 'unknown')
        )
        conv.set_entities(result.get('entities', {}))
        session.add(conv)
        session.commit()
        session.close()
        
        return result
    
    def _fallback_parse(self, message: str) -> Dict:
        """Simple keyword-based intent parsing with entity extraction"""
        import re
        message_lower = message.lower()
        entities = {}
        
        # Extract origin and destination: "from X to Y" or "X to Y"
        # Updated to handle both "from X to Y" and just "X to Y"
        # Try with "from" first
        from_to_pattern = r'from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+december|\s+dec|\.|$)'
        match = re.search(from_to_pattern, message_lower)
        
        # If no match, try without "from" - match "X to Y" pattern
        if not match:
            # Match airport codes or city names followed by "to"
            simple_pattern = r'([a-z]{2,})\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+december|\s+dec|\s+in|\.|$)'
            match = re.search(simple_pattern, message_lower)
        
        if match:
            origin = match.group(1).strip()
            destination = match.group(2).strip()
            # Handle common city abbreviations
            city_map = {
                'san jose': 'SJC', 'sanjose': 'SJC', 
                'la': 'LAX', 'los angeles': 'LAX', 'losangeles': 'LAX',
                'new york': 'NYC', 'newyork': 'NYC', 'ny': 'NYC',
                'san francisco': 'SFO', 'sanfrancisco': 'SFO', 'sf': 'SFO',
                'miami': 'MIA', 'boston': 'BOS', 'chicago': 'CHI',
                'seattle': 'SEA', 'portland': 'PDX', 'denver': 'DEN'
            }
            entities['origin'] = city_map.get(origin.lower(), origin.upper())
            entities['destination'] = city_map.get(destination.lower(), destination.upper())
        
        # Extract dates: "december 23rd to 25th", "dec 23 to dec 25"
        # First try to find date range pattern
        date_range_pattern = r'(?:december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?'
        date_range_match = re.search(date_range_pattern, message_lower)
        if date_range_match:
            entities['start_date'] = f"2025-12-{date_range_match.group(1).zfill(2)}"
            entities['end_date'] = f"2025-12-{date_range_match.group(2).zfill(2)}"
        else:
            # Fallback to individual dates
            date_pattern = r'(?:december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?'
            date_matches = re.findall(date_pattern, message_lower)
            if len(date_matches) >= 1:
                entities['start_date'] = f"2025-12-{date_matches[0].zfill(2)}"
            if len(date_matches) >= 2:
                entities['end_date'] = f"2025-12-{date_matches[1].zfill(2)}"
        
        # Extract party size: "2 people"
        party_match = re.search(r'(\d+)\s+(?:people|person|passenger|guest)', message_lower)
        if party_match:
            entities['party_size'] = int(party_match.group(1))
        
        # Extract budget: "budget 5000", "for 1000 dollars", "$500"
        budget_match = re.search(r'(?:budget\s+(?:of\s+)?|for\s+)\$?(\d+)\s*(?:dollars?|usd)?', message_lower)
        if budget_match:
            entities['budget'] = float(budget_match.group(1))
        
        # Search for flights
        if any(word in message_lower for word in ['flight', 'fly', 'airline', 'plane']):
            return {
                'intent': 'search_flights',
                'entities': entities,
                'confidence': 0.7
            }
        
        # Search for hotels
        if any(word in message_lower for word in ['hotel', 'stay', 'accommodation', 'room']):
            return {
                'intent': 'search_hotels',
                'entities': entities,
                'confidence': 0.7
            }
        
        # Trip planning
        if any(word in message_lower for word in ['trip', 'weekend', 'vacation', 'travel', 'plan']):
            return {
                'intent': 'plan_trip',
                'entities': entities,
                'confidence': 0.7
            }
        
        # Looking for deals
        if any(word in message_lower for word in ['deal', 'cheap', 'discount', 'best price', 'find']):
            return {
                'intent': 'find_deals',
                'entities': entities,
                'confidence': 0.7
            }
        
        return {
            'intent': 'general_inquiry',
            'entities': entities,
            'confidence': 0.5
        }
    
    async def refine(self, original_query: str, refinement: str, previous_entities: Dict) -> Dict:
        """
        Refine a search with new constraints
        
        Args:
            original_query: Original user query
            refinement: New refinement text
            previous_entities: Previously extracted entities
            
        Returns:
            Updated entities dict
        """
        updated_entities = await refine_search(original_query, refinement, previous_entities)
        return updated_entities
    
    def get_conversation_history(self, user_id: str, limit: int = 5) -> List[Dict]:
        """
        Get recent conversation history for a user
        
        Args:
            user_id: User identifier
            limit: Number of recent conversations
            
        Returns:
            List of conversation dicts
        """
        session = get_session()
        conversations = session.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(Conversation.created_at.desc()).limit(limit).all()
        
        history = []
        for conv in reversed(conversations):
            history.append({"role": "user", "content": conv.message})
            if conv.response:
                history.append({"role": "assistant", "content": conv.response})
        
        session.close()
        return history

