"""
Offer Tagger Agent
Tags deals with relevant metadata and features
"""

from typing import Dict, List

class OfferTaggerAgent:
    """Tags deals with relevant features and metadata"""
    
    def __init__(self):
        pass
    
    def tag_deal(self, deal_data: Dict) -> Dict:
        """Tag a deal with relevant features"""
        tags = set(deal_data.get('tags', []))
        metadata = deal_data.get('metadata', {})
        deal_type = deal_data.get('type')
        
        discount_pct = ((deal_data.get('original_price', 0) - deal_data.get('price', 0)) / deal_data.get('original_price', 1)) * 100
        if discount_pct >= 30:
            tags.add('hot-deal')
        elif discount_pct >= 20:
            tags.add('great-value')
        elif discount_pct >= 15:
            tags.add('good-deal')
        
        inventory = deal_data.get('available_inventory', 100)
        if inventory <= 3:
            tags.add('almost-sold-out')
        elif inventory <= 10:
            tags.add('limited-availability')
        
        if deal_type == 'flight':
            tags.update(self._tag_flight(metadata))
        elif deal_type == 'hotel':
            tags.update(self._tag_hotel(metadata))
        
        deal_data['tags'] = list(tags)
        deal_data['discount_percent'] = discount_pct
        return deal_data
    
    def _tag_flight(self, metadata: Dict) -> List[str]:
        """Tag flight-specific features"""
        tags = []
        if metadata.get('baggage_included'):
            tags.append('baggage-included')
        cabin_class = metadata.get('cabin_class', '').lower()
        if 'business' in cabin_class or 'first' in cabin_class:
            tags.append('premium-cabin')
        return tags
    
    def _tag_hotel(self, metadata: Dict) -> List[str]:
        """Tag hotel-specific features"""
        tags = []
        
        # Rating-based tags
        rating = metadata.get('rating', 0)
        if rating >= 4.5:
            tags.append('luxury')
        elif rating >= 4.0:
            tags.append('upscale')
        elif rating >= 3.0:
            tags.append('comfort')
        
        # Refund policy tags
        refundable = metadata.get('refundable', metadata.get('free_cancellation', False))
        if refundable:
            tags.append('refundable')
        else:
            tags.append('non-refundable')
        
        # Pet policy
        if metadata.get('pet_friendly', False):
            tags.append('pet-friendly')
        
        # Location/transit tags
        if metadata.get('near_transit', False) or metadata.get('near_subway', False):
            tags.append('near-transit')
        
        # Amenity-based tags
        amenities = metadata.get('amenities', [])
        amenity_tags = {
            'breakfast': 'breakfast-included',
            'wifi': 'free-wifi',
            'pool': 'pool',
            'gym': 'fitness-center',
            'parking': 'parking-available',
            'airport': 'airport-shuttle'
        }
        
        for amenity, tag in amenity_tags.items():
            if any(amenity in str(a).lower() for a in amenities):
                tags.append(tag)
        
        return tags

