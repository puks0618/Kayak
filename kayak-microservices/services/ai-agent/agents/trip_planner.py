"""
Trip Planner Agent
Composes flight+hotel bundles and calculates fit scores
"""

from typing import Dict, List
from datetime import datetime
from models.database import get_session, Deal, TripPlan
from config import config
import uuid

class TripPlannerAgent:
    """Plan trips by bundling flights and hotels"""
    
    def __init__(self):
        self.max_recommendations = config.MAX_BUNDLE_RECOMMENDATIONS
        self.fit_weights = config.FIT_SCORE_WEIGHTS
    
    def calculate_fit_score(self, bundle: Dict, user_context: Dict) -> float:
        """Calculate how well a bundle fits user requirements (0-100)"""
        score = 0.0
        budget = user_context.get('budget')
        total_cost = bundle.get('total_cost', 0)
        if budget and budget > 0:
            if total_cost <= budget * 0.8:
                score += 40
            elif total_cost <= budget:
                score += 30
            elif total_cost <= budget * 1.1:
                score += 15
        else:
            score += 20
        user_prefs = set(user_context.get('preferences', []))
        bundle_features = set()
        flight_tags = bundle.get('flight', {}).get('tags', [])
        hotel_tags = bundle.get('hotel', {}).get('tags', [])
        bundle_features.update(flight_tags + hotel_tags)
        if user_prefs:
            matched = user_prefs.intersection(bundle_features)
            match_ratio = len(matched) / len(user_prefs) if user_prefs else 0
            score += match_ratio * 35
        else:
            score += 17
        hotel = bundle.get('hotel', {})
        hotel_tags = set(hotel.get('tags', []))
        convenience_features = {'near-transit', 'downtown', 'airport-shuttle'}
        matched_convenience = len(convenience_features.intersection(hotel_tags))
        score += min(25, matched_convenience * 8)
        return min(100.0, score)
    
    async def plan_trip(self, user_context: Dict) -> List[Dict]:
        """Create trip plans by bundling flights and hotels"""
        session = get_session()
        deals = session.query(Deal).filter(Deal.active == True).all()
        flights = [d for d in deals if d.type == 'flight']
        hotels = [d for d in deals if d.type == 'hotel']
        
        # Handle None destination safely
        destination_raw = user_context.get('destination')
        destination = destination_raw.upper() if destination_raw else None
        
        # Handle cities with multiple airports
        AIRPORT_GROUPS = {
            'NRT': ['NRT', 'HND'],  # Tokyo
            'HND': ['NRT', 'HND'],
            'JFK': ['JFK', 'LGA', 'EWR'],  # New York
            'LGA': ['JFK', 'LGA', 'EWR'],
            'EWR': ['JFK', 'LGA', 'EWR'],
            'ORD': ['ORD', 'MDW'],  # Chicago
            'MDW': ['ORD', 'MDW'],
        }
        
        # Get all valid airport codes for destination (handle None)
        dest_codes = AIRPORT_GROUPS.get(destination, [destination]) if destination else []
        
        # Map airport codes to city names for hotel search
        AIRPORT_TO_CITY = {
            'NRT': 'TOKYO', 'HND': 'TOKYO',
            'JFK': 'NEW YORK', 'LGA': 'NEW YORK', 'EWR': 'NEW YORK',
            'ORD': 'CHICAGO', 'MDW': 'CHICAGO',
            'LAX': 'LOS ANGELES', 'SFO': 'SAN FRANCISCO',
            'MIA': 'MIAMI', 'BOS': 'BOSTON', 'SEA': 'SEATTLE',
            'LAS': 'LAS VEGAS', 'DEN': 'DENVER', 'ATL': 'ATLANTA',
            'LHR': 'LONDON', 'CDG': 'PARIS', 'FRA': 'FRANKFURT',
            'FCO': 'ROME', 'BCN': 'BARCELONA', 'AMS': 'AMSTERDAM',
            'DXB': 'DUBAI', 'SIN': 'SINGAPORE', 'SYD': 'SYDNEY',
            'BKK': 'BANGKOK', 'HKG': 'HONG KONG',
        }
        
        # Get city name for hotel search (handle None destination)
        city_name = AIRPORT_TO_CITY.get(destination, destination) if destination else None
        
        print(f"🔍 Trip Planner: Looking for destination={destination}, codes={dest_codes}, city={city_name}")
        print(f"📊 Total deals: {len(deals)}, flights: {len(flights)}, hotels: {len(hotels)}")
        
        if destination:
            flights = [f for f in flights if f.get_metadata().get('destination', '').upper() in dest_codes]
            # For hotels, search by city name
            if city_name:
                hotels = [h for h in hotels if city_name in h.get_metadata().get('city', '').upper()]
        
        print(f"✈️  After filtering: {len(flights)} flights, {len(hotels)} hotels to {destination}")
        bundles = []
        for flight in flights[:10]:
            for hotel in hotels[:5]:
                party_size = user_context.get('party_size', 1)
                flight_cost = flight.price * party_size
                nights = 1
                hotel_cost = hotel.price * nights
                total_cost = flight_cost + hotel_cost
                bundle = {
                    'flight': {'deal_id': flight.deal_id, 'title': flight.title, 'price': flight.price, 'tags': flight.get_tags()},
                    'hotel': {'deal_id': hotel.deal_id, 'title': hotel.title, 'price_per_night': hotel.price, 'tags': hotel.get_tags()},
                    'total_cost': total_cost,
                    'party_size': party_size
                }
                bundle['fit_score'] = self.calculate_fit_score(bundle, user_context)
                bundles.append(bundle)
        bundles.sort(key=lambda x: x['fit_score'], reverse=True)
        top_bundles = bundles[:self.max_recommendations]
        user_id = user_context.get('user_id', 'anonymous')
        for bundle in top_bundles:
            plan_id = str(uuid.uuid4())
            trip_plan = TripPlan(plan_id=plan_id, user_id=user_id, query=str(user_context), fit_score=bundle['fit_score'], total_cost=bundle['total_cost'])
            trip_plan.set_itinerary(bundle)
            session.add(trip_plan)
        session.commit()
        session.close()
        return top_bundles

