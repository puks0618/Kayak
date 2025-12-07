"""
Enhanced Kafka Service using aiokafka
"""

from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from typing import Callable, Optional, List
import json
import asyncio
from config import config

class KafkaService:
    """Kafka service for producing and consuming messages"""
    
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None
        self.consumers: dict = {}
        self.admin_client: Optional[AIOKafkaAdminClient] = None
    
    async def start_producer(self):
        """Start Kafka producer"""
        self.producer = AIOKafkaProducer(
            bootstrap_servers=config.KAFKA_BROKERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            compression_type='gzip'
        )
        await self.producer.start()
        print("✅ Kafka producer started")
    
    async def stop_producer(self):
        """Stop Kafka producer"""
        if self.producer:
            await self.producer.stop()
            print("❌ Kafka producer stopped")
    
    async def produce(self, topic: str, message: dict, key: Optional[str] = None):
        """
        Produce a message to Kafka topic
        
        Args:
            topic: Topic name
            message: Message dict
            key: Optional key for partitioning
        """
        if not self.producer:
            await self.start_producer()
        
        try:
            key_bytes = key.encode('utf-8') if key else None
            await self.producer.send(topic, message, key=key_bytes)
            print(f"📤 Produced to {topic}: {key or 'no-key'}")
        except Exception as e:
            print(f"❌ Error producing to {topic}: {e}")
    
    async def create_consumer(
        self,
        topic: str,
        consumer_id: str,
        handler: Callable,
        group_id: Optional[str] = None
    ):
        """
        Create and start a consumer for a topic
        
        Args:
            topic: Topic to consume
            consumer_id: Unique consumer identifier
            handler: Async function to handle messages
            group_id: Consumer group ID
        """
        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=config.KAFKA_BROKERS,
            group_id=group_id or config.KAFKA_CONSUMER_GROUP,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True
        )
        
        await consumer.start()
        self.consumers[consumer_id] = consumer
        print(f"✅ Kafka consumer started: {consumer_id} on {topic}")
        
        # Start consuming in background
        asyncio.create_task(self._consume_loop(consumer_id, consumer, handler))
    
    async def _consume_loop(self, consumer_id: str, consumer: AIOKafkaConsumer, handler: Callable):
        """Internal loop for consuming messages"""
        try:
            async for message in consumer:
                try:
                    print(f"📥 {consumer_id} received message from {message.topic}")
                    await handler(message.value)
                except Exception as e:
                    print(f"❌ Error in handler for {consumer_id}: {e}")
        except Exception as e:
            print(f"❌ Consumer {consumer_id} error: {e}")
        finally:
            await consumer.stop()
    
    async def stop_consumer(self, consumer_id: str):
        """Stop a specific consumer"""
        if consumer_id in self.consumers:
            await self.consumers[consumer_id].stop()
            del self.consumers[consumer_id]
            print(f"❌ Kafka consumer stopped: {consumer_id}")
    
    async def stop_all_consumers(self):
        """Stop all consumers"""
        for consumer_id in list(self.consumers.keys()):
            await self.stop_consumer(consumer_id)
    
    async def create_topics(self, topics: List[str]):
        """
        Create Kafka topics if they don't exist
        
        Args:
            topics: List of topic names
        """
        self.admin_client = AIOKafkaAdminClient(
            bootstrap_servers=config.KAFKA_BROKERS
        )
        await self.admin_client.start()
        
        try:
            new_topics = [
                NewTopic(name=topic, num_partitions=3, replication_factor=1)
                for topic in topics
            ]
            await self.admin_client.create_topics(new_topics, validate_only=False)
            print(f"✅ Created topics: {', '.join(topics)}")
        except Exception as e:
            print(f"⚠️  Topics might already exist: {e}")
        finally:
            await self.admin_client.close()
    
    async def shutdown(self):
        """Shutdown all Kafka connections"""
        await self.stop_all_consumers()
        await self.stop_producer()


# Global Kafka service instance
kafka_service = KafkaService()


async def init_kafka():
    """Initialize Kafka topics and producer"""
    topics = [
        config.TOPIC_RAW_FEEDS,
        config.TOPIC_NORMALIZED,
        config.TOPIC_SCORED,
        config.TOPIC_TAGGED,
        config.TOPIC_EVENTS,
        config.TOPIC_USER_QUERIES,
        config.TOPIC_TRIP_PLANS
    ]
    
    await kafka_service.create_topics(topics)
    await kafka_service.start_producer()

