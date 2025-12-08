"""
AI Service for AI-powered features (using Ollama)
"""

import requests
from typing import Dict, List, Optional
from config import config
import json


def call_ollama(prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> str:
    """Helper function to call Ollama API"""
    try:
        print(f"🤖 Calling Ollama at {config.OLLAMA_BASE_URL} with model {config.OLLAMA_MODEL}")
        response = requests.post(
            f"{config.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": config.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Ollama returned status {response.status_code}")
            raise Exception(f"Ollama API error: {response.status_code}")
        
        result = response.json().get("response", "").strip()
        print(f"✅ Ollama responded: {result[:100]}...")
        return result
    except Exception as e:
        print(f"❌ Error calling Ollama: {e}")
        raise


async def parse_intent(user_query: str, conversation_history: Optional[List[Dict]] = None) -> Dict:
    """
    Parse user intent and extract entities using GPT-4
    
    Returns:
        {
            "intent": "search|book|refine|track|question",
            "entities": {
                "origin": str,
                "destination": str,
                "start_date": str (YYYY-MM-DD),
                "end_date": str (YYYY-MM-DD),
                "budget": float,
                "party_size": int,
                "preferences": List[str]
            },
            "confidence": float
        }
    """
    
    system_prompt = """You are a travel intent parser. Return ONLY valid JSON, no other text.

Extract travel information from queries and convert cities to airport codes.

City to Airport Code mappings (use these):
- San Francisco/SF -> SFO, Los Angeles/LA -> LAX, New York/NYC -> JFK
- Miami -> MIA, Chicago -> ORD, Boston -> BOS, Seattle -> SEA
- Las Vegas -> LAS, Denver -> DEN, Atlanta -> ATL, Dallas -> DFW
- London -> LHR, Paris -> CDG, Tokyo -> NRT, Dubai -> DXB
- Singapore -> SIN, Sydney -> SYD, Bangkok -> BKK, Hong Kong -> HKG
- Barcelona -> BCN, Rome -> FCO, Amsterdam -> AMS, Frankfurt -> FRA
- Mexico City -> MEX, Toronto -> YYZ, Montreal -> YUL

Examples:
Query: "Find me a flight from San Jose to LA"
{
  "intent": "search",
  "entities": {
    "origin": "SJC",
    "destination": "LAX"
  },
  "confidence": 0.95
}

Query: "I need a weekend trip to Miami under $500"
{
  "intent": "search",
  "entities": {
    "destination": "MIA",
    "budget": 500
  },
  "confidence": 0.9
}

Query: "Plan a trip to Tokyo for 2 people under $3000"
{
  "intent": "plan_trip",
  "entities": {
    "destination": "NRT",
    "passengers": 2,
    "budget": 3000
  },
  "confidence": 0.95
}

Rules:
- intent must be one of: search, plan_trip, book, refine, track, question
- origin/destination should be ONLY airport codes (3 letters), never city names or other words
- budget must be the full numeric amount (e.g., 3000 not 3)
- passengers/party_size should be extracted from "for X people"
- CRITICAL: "flights to X" means X is the DESTINATION (where you're going), NOT the origin
- CRITICAL: "flights from X to Y" means X is origin, Y is destination
- CRITICAL: If query only says "to X" or "going to X", that's DESTINATION only, leave origin empty
- IGNORE words like "plan", "trip", "find", "vacation", "cheap", "show" - they are NOT locations
- If NO destination is mentioned in the query, DO NOT include destination in entities
- Return ONLY the JSON object, no other text"""

    messages = [{"role": "system", "content": system_prompt}]
    
    if conversation_history:
        messages.extend(conversation_history[-5:])  # Last 5 messages for context
    
    messages.append({"role": "user", "content": user_query})
    
    try:
        # Build conversation context for Ollama
        conversation_text = system_prompt + "\n\n"
        if conversation_history:
            for msg in conversation_history[-5:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                conversation_text += f"{role}: {content}\n"
        conversation_text += f"user: {user_query}\n\nRespond with valid JSON only."
        
        # Call Ollama API
        response_text = call_ollama(conversation_text, config.OLLAMA_TEMPERATURE, config.OLLAMA_MAX_TOKENS)
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        # Extract only the JSON part - find first { and last }
        response_text = response_text.strip()
        first_brace = response_text.find('{')
        last_brace = response_text.rfind('}')
        if first_brace != -1 and last_brace != -1:
            response_text = response_text[first_brace:last_brace+1]
        
        result = json.loads(response_text.strip())
        return result
    
    except Exception as e:
        print(f"Error parsing intent with Ollama: {e}")
        # Raise the exception so the fallback parser can handle it
        raise


async def generate_explanation(deal: Dict, context: Dict, max_words: int = 25) -> str:
    """
    Generate a concise explanation for why this deal is recommended
    
    Args:
        deal: Deal information
        context: User context (budget, preferences, etc.)
        max_words: Maximum words in explanation
    
    Returns:
        Explanation string (≤ max_words)
    """
    
    prompt = f"""Generate a concise explanation (max {max_words} words) for why this deal is good.

Deal:
- Type: {deal.get('type')}
- Price: ${deal.get('price')}
- Original: ${deal.get('original_price')}
- Discount: {deal.get('discount_percent')}%
- Tags: {', '.join(deal.get('tags', []))}

User Context:
- Budget: ${context.get('budget', 'N/A')}
- Preferences: {', '.join(context.get('preferences', []))}

Focus on: price value, preference match, key amenities. Be specific and compelling."""

    try:
        explanation = call_ollama(prompt, temperature=0.7, max_tokens=100)
        return explanation
    
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return f"{deal.get('discount_percent', 0):.0f}% below average, matches your preferences"


async def generate_watch_alert(change: Dict, max_words: int = 12) -> str:
    """
    Generate a concise alert message for price/inventory changes
    
    Args:
        change: Change information (old_price, new_price, inventory, etc.)
        max_words: Maximum words
    
    Returns:
        Alert message (≤ max_words)
    """
    
    prompt = f"""Generate a very concise alert (max {max_words} words) about this change:

Change:
{json.dumps(change, indent=2)}

Be urgent and specific. Focus on the key change."""

    try:
        alert = call_ollama(prompt, temperature=0.6, max_tokens=50)
        return alert
    
    except Exception as e:
        print(f"Error generating alert: {e}")
        if 'old_price' in change and 'new_price' in change:
            return f"Price dropped ${change['old_price'] - change['new_price']}"
        return "Deal updated"


async def answer_policy_question(question: str, listing_metadata: Dict = None) -> str:
    """
    Answer policy-related questions using knowledge base
    
    Args:
        question: User's question about policies
        listing_metadata: Optional listing information for context
    
    Returns:
        Answer from policy knowledge base or AI-generated response
    """
    
    # Try to get answer from policy knowledge base first
    try:
        from knowledge.policies import get_policy_answer, get_airline_policy
        
        # Check for airline-specific question FIRST (higher priority)
        question_lower = question.lower()
        for airline in ['Delta', 'United', 'American', 'Southwest', 'Spirit', 'JetBlue']:
            if airline.lower() in question_lower:
                if 'baggage' in question_lower or 'bag' in question_lower:
                    answer = get_airline_policy(airline, 'baggage')
                    if answer:
                        return answer
                elif 'change' in question_lower:
                    answer = get_airline_policy(airline, 'change')
                    if answer:
                        return answer
                elif 'cancel' in question_lower:
                    answer = get_airline_policy(airline, 'cancellation')
                    if answer:
                        return answer
        
        # Fall back to general policy answer
        policy_answer = get_policy_answer(question)
        if policy_answer:
            return policy_answer.strip()
    
    except Exception as e:
        print(f"Error accessing policy knowledge base: {e}")
    
    # Fall back to AI if no policy found
    if listing_metadata:
        prompt = f"""Answer the user's question about this travel listing based ONLY on the provided information.
If the information isn't available, say so clearly.

Listing Information:
{json.dumps(listing_metadata, indent=2)}

User Question: {question}

Provide a clear, factual answer (2-3 sentences max)."""
    else:
        prompt = f"""Answer this travel policy question clearly and concisely.

Question: {question}

Provide a helpful answer based on common travel industry practices (2-3 sentences)."""

    try:
        answer = call_ollama(prompt, temperature=0.3, max_tokens=150)
        return answer
    
    except Exception as e:
        print(f"Error answering question: {e}")
        return "I'm unable to answer that question at the moment. Please try rephrasing or check with the provider directly."


async def refine_search(original_query: str, refinement: str, previous_entities: Dict) -> Dict:
    """
    Refine a search with new constraints while preserving context
    
    Args:
        original_query: Original user query
        refinement: New refinement/constraint
        previous_entities: Previously extracted entities
    
    Returns:
        Updated entities dict
    """
    
    prompt = f"""The user is refining their search. Update the entities while preserving previous context.

Original Query: {original_query}
Previous Entities: {json.dumps(previous_entities, indent=2)}

New Refinement: {refinement}

Return updated entities as JSON. Only change what the refinement modifies."""

    try:
        response_text = call_ollama(prompt, temperature=0.5, max_tokens=300)
        updated_entities = json.loads(response_text)
        return updated_entities
    
    except Exception as e:
        print(f"Error refining search: {e}")
        return previous_entities


async def compare_deals(deals: List[Dict], context: Dict) -> str:
    """
    Generate a comparison between multiple deals
    
    Args:
        deals: List of deals to compare
        context: User context
    
    Returns:
        Comparison text
    """
    
    prompt = f"""Compare these travel deals for the user. Highlight key differences and which might be best for different priorities.

Deals:
{json.dumps(deals, indent=2)}

User Context:
{json.dumps(context, indent=2)}

Provide a brief comparison (3-4 sentences) highlighting tradeoffs."""

    try:
        comparison = call_ollama(prompt, temperature=0.7, max_tokens=200)
        return comparison
    
    except Exception as e:
        print(f"Error comparing deals: {e}")
        return "All deals offer good value. Review details to find the best fit for your needs."
