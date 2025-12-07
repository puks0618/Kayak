"""
Feed Ingestion Agent
Pulls flights and hotels from kayak_listings MySQL database and publishes to Kafka
"""

from typing import List, Dict
import aiomysql
import asyncio
from datetime import datetime
from config import config
from services.kafka_service import kafka_service

class FeedIngestionAgent:
    """Ingests data from kayak_listings MySQL database"""
    
    def __init__(self):
        self.pool = None
    
    async def init_db_pool(self):
        """Initialize MySQL connection pool"""
        if not self.pool:
            self.pool = await aiomysql.create_pool(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                db=config.MYSQL_DATABASE,
                minsize=1,
                maxsize=10
            )
            print("✅ MySQL connection pool created for feed ingestion")
    
    async def ingest_flights_from_db(self):
        """Ingest flights from kayak_listings database"""
        if not self.pool:
            await self.init_db_pool()
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Query all flights
                    await cursor.execute("""
                        SELECT 
                            id, flight_code, airline, departure_airport, arrival_airport,
                            departure_time, arrival_time, duration, price, seats_total,
                            seats_left, cabin_class, base_price, discount_percent, created_at
                        FROM flights 
                        ORDER BY departure_time
                        LIMIT 100
                    """)
                    flights = await cursor.fetchall()
                    
                    print(f"📂 Ingesting {len(flights)} flights from kayak_listings database")
                    
                    for flight in flights:
                        feed_data = {
                            'feed_type': 'flight',
                            'data': {
                                'id': flight['id'],
                                'route_id': flight['flight_code'],
                                'origin': flight['departure_airport'],
                                'destination': flight['arrival_airport'],
                                'airline': flight['airline'],
                                'departure': flight['departure_time'].isoformat() if flight['departure_time'] else None,
                                'arrival': flight['arrival_time'].isoformat() if flight['arrival_time'] else None,
                                'price': float(flight['price']),
                                'original_price': float(flight.get('base_price', flight['price'])),
                                'available_seats': flight.get('seats_left', flight['seats_total']),
                                'cabin_class': flight.get('cabin_class', 'economy'),
                                'baggage_included': bool(flight.get('baggage_info'))
                            },
                            'source': 'kayak_listings_db',
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                        await kafka_service.produce(
                            config.TOPIC_RAW_FEEDS,
                            feed_data,
                            key=flight['flight_code']
                        )
                    
                    print(f"✅ Ingested {len(flights)} flights from database")
                    return len(flights)
        
        except Exception as e:
            print(f"❌ Error ingesting flights from database: {e}")
            return 0
    
    async def ingest_hotels_from_db(self):
        """Ingest hotels from kayak_listings database"""
        if not self.pool:
            await self.init_db_pool()
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Query all hotels
                    await cursor.execute("""
                        SELECT 
                            id, name, address, city, state, zip_code, star_rating,
                            price_per_night, num_rooms, room_type, amenities, rating,
                            created_at
                        FROM hotels
                        ORDER BY city
                        LIMIT 100
                    """)
                    hotels = await cursor.fetchall()
                    
                    print(f"📂 Ingesting {len(hotels)} hotels from kayak_listings database")
                    
                    for hotel in hotels:
                        # Parse amenities if JSON
                        amenities = hotel.get('amenities', [])
                        if isinstance(amenities, str):
                            try:
                                import json
                                amenities = json.loads(amenities) if amenities else []
                            except:
                                amenities = amenities.split(',') if amenities else []
                        
                        feed_data = {
                            'feed_type': 'hotel',
                            'data': {
                                'id': hotel['id'],
                                'hotel_id': hotel['id'],
                                'name': hotel['name'],
                                'city': hotel['city'],
                                'state': hotel.get('state', ''),
                                'address': hotel.get('address', ''),
                                'price_per_night': float(hotel['price_per_night']),
                                'original_price': float(hotel['price_per_night']) * 1.2,  # Simulate 17% discount
                                'available_rooms': hotel.get('num_rooms', 10),
                                'rating': float(hotel.get('rating', hotel.get('star_rating', 3))),
                                'star_rating': int(hotel.get('star_rating', 3)),
                                'amenities': amenities if isinstance(amenities, list) else [],
                                'pet_friendly': False,  # Not in schema
                                'refundable': True,  # Default value
                                'near_transit': False  # Not in schema
                            },
                            'source': 'kayak_listings_db',
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                        await kafka_service.produce(
                            config.TOPIC_RAW_FEEDS,
                            feed_data,
                            key=hotel['id']
                        )
                    
                    print(f"✅ Ingested {len(hotels)} hotels from database")
                    return len(hotels)
        
        except Exception as e:
            print(f"❌ Error ingesting hotels from database: {e}")
            return 0
    
    async def normalize_feed_data(self, raw_data: Dict) -> Dict:
        """
        Normalize raw feed data to standard format
        
        Args:
            raw_data: Raw feed data from Kafka
            
        Returns:
            Normalized deal data
        """
        feed_type = raw_data.get('feed_type')
        data = raw_data.get('data', {})
        
        if feed_type == 'flight':
            return await self._normalize_flight(data)
        elif feed_type == 'hotel':
            return await self._normalize_hotel(data)
        else:
            return {}
    
    async def _normalize_flight(self, data: Dict) -> Dict:
        """Normalize flight data"""
        return {
            'deal_id': f"flight_{data.get('route_id', data.get('id', ''))}",
            'type': 'flight',
            'title': f"{data.get('origin', '')} to {data.get('destination', '')} - {data.get('airline', '')}",
            'description': f"{data.get('cabin_class', 'Economy')} class flight",
            'price': float(data.get('price', 0)),
            'original_price': float(data.get('original_price', data.get('price', 0))),
            'available_inventory': int(data.get('available_seats', 100)),
            'metadata': {
                'origin': data.get('origin', ''),
                'destination': data.get('destination', ''),
                'airline': data.get('airline', ''),
                'departure': data.get('departure', ''),
                'arrival': data.get('arrival', ''),
                'cabin_class': data.get('cabin_class', 'Economy'),
                'baggage_included': data.get('baggage_included', False),
                'flight_code': data.get('route_id', '')
            },
            'tags': [],
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def _normalize_hotel(self, data: Dict) -> Dict:
        """Normalize hotel data"""
        amenities = data.get('amenities', [])
        if isinstance(amenities, str):
            amenities = amenities.split(',')
        
        tags = []
        if data.get('pet_friendly'):
            tags.append('pet-friendly')
        if data.get('refundable'):
            tags.append('refundable')
        if data.get('near_transit'):
            tags.append('near-transit')
        
        return {
            'deal_id': f"hotel_{data.get('hotel_id', data.get('id', ''))}",
            'type': 'hotel',
            'title': data.get('name', 'Hotel'),
            'description': f"{data.get('rating', 3)} star hotel in {data.get('city', '')}",
            'price': float(data.get('price_per_night', 0)),
            'original_price': float(data.get('original_price', data.get('price_per_night', 0))),
            'available_inventory': int(data.get('available_rooms', 10)),
            'metadata': {
                'city': data.get('city', ''),
                'state': data.get('state', ''),
                'address': data.get('address', ''),
                'rating': float(data.get('rating', 3)),
                'amenities': amenities
            },
            'tags': tags,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def run_periodic_ingestion(self):
        """Run periodic feed ingestion from database"""
        await self.init_db_pool()
        
        while True:
            try:
                print("⏰ Starting periodic ingestion from kayak_listings database...")
                
                flights_count = await self.ingest_flights_from_db()
                hotels_count = await self.ingest_hotels_from_db()
                
                print(f"✅ Ingestion complete: {flights_count} flights, {hotels_count} hotels")
                print(f"⏰ Next ingestion in {config.FEED_INGESTION_INTERVAL} seconds")
                
                await asyncio.sleep(config.FEED_INGESTION_INTERVAL)
            
            except Exception as e:
                print(f"❌ Error in periodic ingestion: {e}")
                await asyncio.sleep(60)
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            print("❌ MySQL connection pool closed")

