"""
Background Kafka Workers
Handles Kafka consumers for the deal pipeline
"""

import asyncio
from services.kafka_service import kafka_service
from agents.feed_ingestion import FeedIngestionAgent
from agents.deal_detector import DealDetector
from agents.offer_tagger import OfferTaggerAgent
from models.database import get_session, Deal, PriceHistory
from datetime import datetime
from config import config

# Initialize agents
feed_agent = FeedIngestionAgent()
deal_detector = DealDetector()
offer_tagger = OfferTaggerAgent()


async def handle_raw_feed(message: dict):
    """
    Handle raw feed messages and normalize them
    Consumer for: raw_supplier_feeds
    Produces to: deals.normalized
    """
    try:
        print(f"📥 Processing raw feed: {message.get('feed_type')}")
        
        # Normalize the feed data
        normalized = await feed_agent.normalize_feed_data(message)
        
        if normalized:
            # Publish to normalized topic
            await kafka_service.produce(
                config.TOPIC_NORMALIZED,
                normalized,
                key=normalized.get('deal_id')
            )
            print(f"✅ Normalized: {normalized.get('deal_id')}")
    
    except Exception as e:
        print(f"❌ Error handling raw feed: {e}")


async def handle_normalized_deal(message: dict):
    """
    Handle normalized deals and score them
    Consumer for: deals.normalized
    Produces to: deals.scored
    """
    try:
        print(f"📥 Scoring deal: {message.get('deal_id')}")
        
        # Score the deal
        scored = await deal_detector.process_normalized_deal(message)
        
        if scored:
            # Publish to scored topic
            await kafka_service.produce(
                config.TOPIC_SCORED,
                scored,
                key=scored.get('deal_id')
            )
            print(f"✅ Scored: {scored.get('deal_id')} - Score: {scored.get('score')}")
    
    except Exception as e:
        print(f"❌ Error scoring deal: {e}")


async def handle_scored_deal(message: dict):
    """
    Handle scored deals and tag them
    Consumer for: deals.scored
    Produces to: deals.tagged
    """
    try:
        print(f"📥 Tagging deal: {message.get('deal_id')}")
        
        # Tag the deal
        tagged = offer_tagger.tag_deal(message)
        
        if tagged:
            # Publish to tagged topic
            await kafka_service.produce(
                config.TOPIC_TAGGED,
                tagged,
                key=tagged.get('deal_id')
            )
            print(f"✅ Tagged: {tagged.get('deal_id')} - Tags: {tagged.get('tags')}")
    
    except Exception as e:
        print(f"❌ Error tagging deal: {e}")


async def handle_tagged_deal(message: dict):
    """
    Handle tagged deals and save to database
    Consumer for: deals.tagged
    Produces to: deal.events (for new deals)
    """
    try:
        print(f"📥 Saving deal to database: {message.get('deal_id')}")
        
        session = get_session()
        
        # Check if deal already exists
        existing = session.query(Deal).filter(Deal.deal_id == message.get('deal_id')).first()
        
        if existing:
            # Update existing deal
            existing.price = message.get('price')
            existing.original_price = message.get('original_price')
            existing.discount_percent = message.get('discount_percent', 0)
            existing.score = message.get('score')
            existing.set_tags(message.get('tags', []))
            existing.set_metadata(message.get('metadata', {}))
            existing.updated_at = datetime.utcnow()
            
            # Record price history
            price_history = PriceHistory(
                deal_id=message.get('deal_id'),
                price=message.get('price'),
                available_inventory=message.get('available_inventory')
            )
            session.add(price_history)
            
            print(f"✅ Updated existing deal: {message.get('deal_id')}")
        
        else:
            # Create new deal
            deal = Deal(
                deal_id=message.get('deal_id'),
                type=message.get('type'),
                title=message.get('title'),
                description=message.get('description'),
                price=message.get('price'),
                original_price=message.get('original_price'),
                discount_percent=message.get('discount_percent', 0),
                score=message.get('score'),
                tags='',
                deal_metadata='',
                expires_at=message.get('expires_at'),
                active=True
            )
            deal.set_tags(message.get('tags', []))
            deal.set_metadata(message.get('metadata', {}))
            
            session.add(deal)
            
            # Emit new deal event
            await kafka_service.produce(
                config.TOPIC_EVENTS,
                {
                    'event_type': 'new_deal',
                    'deal_id': message.get('deal_id'),
                    'data': message,
                    'timestamp': datetime.utcnow().isoformat()
                },
                key=message.get('deal_id')
            )
            
            print(f"✅ Created new deal: {message.get('deal_id')}")
        
        session.commit()
        session.close()
    
    except Exception as e:
        print(f"❌ Error saving deal: {e}")
        if 'session' in locals():
            session.rollback()
            session.close()


async def start_kafka_workers():
    """Start all Kafka consumer workers"""
    print("🚀 Starting Kafka workers...")
    
    # Start consumers
    await kafka_service.create_consumer(
        config.TOPIC_RAW_FEEDS,
        'feed-normalizer',
        handle_raw_feed
    )
    
    await kafka_service.create_consumer(
        config.TOPIC_NORMALIZED,
        'deal-scorer',
        handle_normalized_deal
    )
    
    await kafka_service.create_consumer(
        config.TOPIC_SCORED,
        'deal-tagger',
        handle_scored_deal
    )
    
    await kafka_service.create_consumer(
        config.TOPIC_TAGGED,
        'deal-saver',
        handle_tagged_deal
    )
    
    print("✅ All Kafka workers started")


async def start_periodic_ingestion():
    """Start periodic database ingestion"""
    print("🚀 Starting periodic database ingestion...")
    await feed_agent.run_periodic_ingestion()
