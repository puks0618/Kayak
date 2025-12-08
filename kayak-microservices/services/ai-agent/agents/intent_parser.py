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
        print(f"🔍 Parsing intent for message: {message}")
        try:
            # Use OpenAI/Ollama to parse intent
            print(f"📞 Calling parse_intent function...")
            result = await parse_intent(message, conversation_history)
            print(f"✅ parse_intent returned: {result}")
            
            # Validate the result - if origin/destination looks wrong, use fallback
            entities = result.get('entities', {})
            origin = entities.get('origin', '')
            destination = entities.get('destination', '')
            
            # Check if origin/destination contains invalid patterns (e.g., whole sentences)
            invalid_patterns = ['FIND', 'FLIGHT', 'FROM', 'NEED', 'TRIP', 'PLEASE', 'PLAN', 'VACATION']
            
            # Check if extracted destination is NOT in the original message (hallucination)
            message_upper = message.upper()
            dest_in_message = False
            if destination:
                # Check if destination or common city names appear in message
                city_variants = {
                    'DXB': ['DUBAI', 'DXB'],
                    'CDG': ['PARIS', 'CDG'],
                    'NRT': ['TOKYO', 'NRT'],
                    'LHR': ['LONDON', 'LHR'],
                    'JFK': ['NEW YORK', 'NYC', 'JFK', 'NY'],
                }
                dest_variants = city_variants.get(destination, [destination])
                dest_in_message = any(variant in message_upper for variant in dest_variants)
            
            if any(pattern in origin.upper() for pattern in invalid_patterns) or \
               any(pattern in destination.upper() for pattern in invalid_patterns) or \
               len(origin) > 20 or len(destination) > 20 or \
               (destination and not dest_in_message):
                print(f"⚠️ Ollama returned invalid/hallucinated entities (origin={origin}, dest={destination}), using fallback")
                result = self._fallback_parse(message)
        except Exception as e:
            print(f"⚠️ OpenAI/Ollama parsing failed: {e}, using fallback")
            import traceback
            traceback.print_exc()
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
        
        # Enhanced city/airport mapping
        city_map = {
            'san jose': 'SJC', 'sanjose': 'SJC', 
            'la': 'LAX', 'los angeles': 'LAX', 'losangeles': 'LAX',
            'new york': 'JFK', 'newyork': 'JFK', 'ny': 'JFK', 'nyc': 'JFK',
            'san francisco': 'SFO', 'sanfrancisco': 'SFO', 'sf': 'SFO',
            'miami': 'MIA', 'boston': 'BOS', 'chicago': 'ORD',
            'seattle': 'SEA', 'portland': 'PDX', 'denver': 'DEN',
            'paris': 'CDG', 'london': 'LHR', 'tokyo': 'NRT',
            'dubai': 'DXB', 'singapore': 'SIN', 'bangkok': 'BKK',
            'hong kong': 'HKG', 'barcelona': 'BCN', 'rome': 'FCO',
            'amsterdam': 'AMS', 'frankfurt': 'FRA', 'sydney': 'SYD',
            'las vegas': 'LAS', 'vegas': 'LAS', 'atlanta': 'ATL'
        }
        
        # Extract origin and destination: "from X to Y" or "X to Y"
        from_to_pattern = r'from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+december|\s+dec|\.|$)'
        match = re.search(from_to_pattern, message_lower)
        
        # If no match, try without "from" - match "X to Y" pattern
        if not match:
            simple_pattern = r'([a-z]{2,})\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+december|\s+dec|\s+in|\.|$)'
            match = re.search(simple_pattern, message_lower)
        
        if match:
            origin = match.group(1).strip()
            destination = match.group(2).strip()
            entities['origin'] = city_map.get(origin.lower(), origin.upper())
            entities['destination'] = city_map.get(destination.lower(), destination.upper())
        else:
            # Try to extract destination from common patterns
            # "flights to CITY", "trip to CITY", "going to CITY"
            dest_patterns = [
                r'(?:flight|fly|trip|go|going|travel)\s+to\s+([a-z\s]+?)(?:\s|$|for|on|,)',
                r'(?:in|visit|visiting)\s+([a-z\s]+?)(?:\s|$|for|on|,)',
            ]
            for pattern in dest_patterns:
                dest_match = re.search(pattern, message_lower)
                if dest_match:
                    dest = dest_match.group(1).strip()
                    # Check if it's a known city
                    if dest in city_map or len(dest) == 3:
                        entities['destination'] = city_map.get(dest, dest.upper())
                        break
        
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
        
        # Extract budget: "budget 5000", "for 1000 dollars", "$500", "under $1000"
        budget_patterns = [
            r'(?:budget\s+(?:of\s+)?|for\s+)\$?(\d+)\s*(?:dollars?|usd)?',
            r'under\s+\$?(\d+)',
            r'\$(\d+)',
        ]
        for pattern in budget_patterns:
            budget_match = re.search(pattern, message_lower)
            if budget_match:
                entities['budget'] = float(budget_match.group(1))
                break
        
        # Trip planning - CHECK FIRST (higher priority than other intents)
        if any(word in message_lower for word in ['trip', 'vacation', 'getaway', 'visit']) and entities.get('budget'):
            return {
                'intent': 'plan_trip',
                'entities': entities,
                'confidence': 0.8
            }
        
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

