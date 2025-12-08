"""
Redis Caching Service for AI Agent - Cache LLM responses, trip plans, and policy Q&A
"""

import redis
import json
import hashlib
from typing import Optional, Dict, Any, List
from datetime import timedelta
from config import config
import logging

logger = logging.getLogger(__name__)


class CacheMetrics:
    """Track cache performance metrics"""
    hits = 0
    misses = 0
    sets = 0
    errors = 0
    
    @classmethod
    def record_hit(cls):
        cls.hits += 1
    
    @classmethod
    def record_miss(cls):
        cls.misses += 1
    
    @classmethod
    def record_set(cls):
        cls.sets += 1
    
    @classmethod
    def record_error(cls):
        cls.errors += 1
    
    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        total = cls.hits + cls.misses
        hit_rate = cls.hits / total if total > 0 else 0
        return {
            "hits": cls.hits,
            "misses": cls.misses,
            "sets": cls.sets,
            "errors": cls.errors,
            "total_requests": total,
            "hit_rate": hit_rate
        }
    
    @classmethod
    def reset(cls):
        cls.hits = 0
        cls.misses = 0
        cls.sets = 0
        cls.errors = 0


class AICache:
    """
    Redis cache for AI agent responses
    Uses DB 3 for AI-specific caching
    """
    
    def __init__(self):
        """Initialize Redis connection for AI caching"""
        try:
            self.redis_client = redis.Redis(
                host=config.REDIS_HOST,
                port=config.REDIS_PORT,
                db=3,  # Use DB 3 for AI cache
                password=config.REDIS_PASSWORD,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("AI Cache connected to Redis DB 3")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _generate_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """
        Generate cache key from data
        
        Args:
            prefix: Key prefix (e.g., 'intent', 'policy', 'trip')
            data: Data to hash
        
        Returns:
            Cache key string
        """
        # Sort dict keys for consistent hashing
        serialized = json.dumps(data, sort_keys=True)
        hash_value = hashlib.md5(serialized.encode()).hexdigest()
        return f"ai:{prefix}:{hash_value}"
    
    def get(self, prefix: str, key_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get cached value
        
        Args:
            prefix: Cache key prefix
            key_data: Data to generate key from
        
        Returns:
            Cached value or None
        """
        if not self.redis_client:
            return None
        
        try:
            key = self._generate_key(prefix, key_data)
            value = self.redis_client.get(key)
            
            if value:
                CacheMetrics.record_hit()
                logger.debug(f"Cache HIT: {prefix} - {key}")
                return json.loads(value)
            else:
                CacheMetrics.record_miss()
                logger.debug(f"Cache MISS: {prefix} - {key}")
                return None
        except Exception as e:
            CacheMetrics.record_error()
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, prefix: str, key_data: Dict[str, Any], value: Dict[str, Any], ttl: int = 3600):
        """
        Set cache value
        
        Args:
            prefix: Cache key prefix
            key_data: Data to generate key from
            value: Value to cache
            ttl: Time to live in seconds (default 1 hour)
        """
        if not self.redis_client:
            return
        
        try:
            key = self._generate_key(prefix, key_data)
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
            CacheMetrics.record_set()
            logger.debug(f"Cache SET: {prefix} - {key} (TTL: {ttl}s)")
        except Exception as e:
            CacheMetrics.record_error()
            logger.error(f"Cache set error: {e}")
    
    def delete(self, prefix: str, key_data: Dict[str, Any]):
        """Delete cache entry"""
        if not self.redis_client:
            return
        
        try:
            key = self._generate_key(prefix, key_data)
            self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {prefix} - {key}")
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
    
    def clear_prefix(self, prefix: str):
        """Clear all cache entries with given prefix"""
        if not self.redis_client:
            return
        
        try:
            pattern = f"ai:{prefix}:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache entries for prefix: {prefix}")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
    
    # Specific cache methods for different AI operations
    
    def get_intent_parsing(self, message: str) -> Optional[Dict[str, Any]]:
        """Get cached intent parsing result"""
        return self.get("intent", {"message": message.lower().strip()})
    
    def set_intent_parsing(self, message: str, result: Dict[str, Any], ttl: int = 7200):
        """Cache intent parsing result (2 hour TTL)"""
        self.set("intent", {"message": message.lower().strip()}, result, ttl)
    
    def get_policy_answer(self, question: str) -> Optional[str]:
        """Get cached policy Q&A answer"""
        cached = self.get("policy", {"question": question.lower().strip()})
        return cached.get("answer") if cached else None
    
    def set_policy_answer(self, question: str, answer: str, ttl: int = 86400):
        """Cache policy Q&A answer (24 hour TTL)"""
        self.set("policy", {"question": question.lower().strip()}, {"answer": answer}, ttl)
    
    def get_trip_plan(self, query_params: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Get cached trip plan bundles"""
        # Normalize query params for consistent caching
        origin = query_params.get("origin")
        destination = query_params.get("destination")
        normalized = {
            "origin": origin.upper() if origin else "",
            "destination": destination.upper() if destination else "",
            "budget": query_params.get("budget"),
            "passengers": query_params.get("passengers", 1)
        }
        cached = self.get("trip", normalized)
        return cached.get("bundles") if cached else None
    
    def set_trip_plan(self, query_params: Dict[str, Any], bundles: List[Dict[str, Any]], ttl: int = 1800):
        """Cache trip plan bundles (30 minute TTL)"""
        origin = query_params.get("origin")
        destination = query_params.get("destination")
        normalized = {
            "origin": origin.upper() if origin else "",
            "destination": destination.upper() if destination else "",
            "budget": query_params.get("budget"),
            "passengers": query_params.get("passengers", 1)
        }
        self.set("trip", normalized, {"bundles": bundles}, ttl)
    
    def get_deal_search(self, search_params: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Get cached deal search results"""
        cached = self.get("deal_search", search_params)
        return cached.get("deals") if cached else None
    
    def set_deal_search(self, search_params: Dict[str, Any], deals: List[Dict[str, Any]], ttl: int = 600):
        """Cache deal search results (10 minute TTL)"""
        self.set("deal_search", search_params, {"deals": deals}, ttl)
    
    def get_explanation(self, deal_id: str, context: str) -> Optional[str]:
        """Get cached explanation"""
        cached = self.get("explanation", {"deal_id": deal_id, "context": context})
        return cached.get("explanation") if cached else None
    
    def set_explanation(self, deal_id: str, context: str, explanation: str, ttl: int = 3600):
        """Cache explanation (1 hour TTL)"""
        self.set("explanation", {"deal_id": deal_id, "context": context}, {"explanation": explanation}, ttl)
    
    def invalidate_trip_cache(self, destination: str = None):
        """
        Invalidate trip planning cache for a destination
        Call this when new deals are added for a destination
        """
        if destination:
            # Clear specific destination
            pattern = f"ai:trip:*{destination.upper()}*"
            try:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                    logger.info(f"Invalidated {len(keys)} trip cache entries for {destination}")
            except Exception as e:
                logger.error(f"Cache invalidation error: {e}")
        else:
            # Clear all trip cache
            self.clear_prefix("trip")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = CacheMetrics.get_stats()
        
        if self.redis_client:
            try:
                # Get Redis info
                info = self.redis_client.info("stats")
                stats.update({
                    "redis_connected": True,
                    "total_commands": info.get("total_commands_processed", 0),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0)
                })
                
                # Get key counts by prefix
                for prefix in ["intent", "policy", "trip", "deal_search", "explanation"]:
                    pattern = f"ai:{prefix}:*"
                    count = len(self.redis_client.keys(pattern))
                    stats[f"{prefix}_keys"] = count
            except Exception as e:
                logger.error(f"Error getting Redis stats: {e}")
                stats["redis_connected"] = False
        else:
            stats["redis_connected"] = False
        
        return stats
    
    def warm_up_cache(self):
        """Warm up cache with common queries"""
        logger.info("Warming up AI cache with common queries...")
        
        common_policies = [
            "What are the baggage fees?",
            "Can I cancel my flight?",
            "How do I change my booking?",
            "What are the check-in requirements?",
            "What is the refund policy?",
            "What are the baggage fees for Southwest?",
            "What are the baggage fees for Spirit?",
            "Can I get a refund?",
            "How early should I arrive?",
            "What items are prohibited?"
        ]
        
        # Pre-cache common policy questions
        from knowledge.policies import get_policy_answer, get_airline_policy
        
        for question in common_policies:
            try:
                # Check if airline-specific
                airline_found = False
                for airline in ['Delta', 'United', 'American', 'Southwest', 'Spirit', 'JetBlue']:
                    if airline.lower() in question.lower():
                        if 'baggage' in question.lower() or 'bag' in question.lower():
                            answer = get_airline_policy(airline, 'baggage')
                            if answer:
                                self.set_policy_answer(question, answer)
                                airline_found = True
                                break
                
                # Fall back to general policy
                if not airline_found:
                    answer = get_policy_answer(question)
                    if answer:
                        self.set_policy_answer(question, answer.strip())
            except Exception as e:
                logger.error(f"Error warming up cache for '{question}': {e}")
        
        logger.info(f"Cache warm-up complete. Cached {len(common_policies)} policy answers")


# Global cache instance
ai_cache = AICache()
