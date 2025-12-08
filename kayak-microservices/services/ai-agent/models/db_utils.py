"""
Database Utilities - Connection Pooling, Transaction Management, Performance Optimization
"""

from typing import Optional, Generator, List, Dict, Any, Callable
from contextlib import contextmanager
from datetime import datetime
from sqlmodel import Session, select, text
from sqlalchemy.pool import StaticPool, QueuePool
from sqlalchemy import create_engine, event, Index
from config import config
import time
import logging
import functools
import inspect

logger = logging.getLogger(__name__)

# Performance metrics
class DBMetrics:
    """Track database performance metrics"""
    query_count = 0
    total_query_time = 0.0
    slow_queries = []
    cache_hits = 0
    cache_misses = 0
    
    @classmethod
    def record_query(cls, query_time: float, query: str = ""):
        """Record query execution time"""
        cls.query_count += 1
        cls.total_query_time += query_time
        if query_time > 0.1:  # Queries slower than 100ms
            cls.slow_queries.append({
                "query": query[:200],
                "time": query_time,
                "timestamp": datetime.utcnow()
            })
            logger.warning(f"Slow query detected: {query_time:.3f}s - {query[:100]}")
    
    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        """Get performance statistics"""
        avg_time = cls.total_query_time / cls.query_count if cls.query_count > 0 else 0
        cache_hit_rate = cls.cache_hits / (cls.cache_hits + cls.cache_misses) if (cls.cache_hits + cls.cache_misses) > 0 else 0
        
        return {
            "total_queries": cls.query_count,
            "total_time": cls.total_query_time,
            "avg_query_time": avg_time,
            "slow_queries_count": len(cls.slow_queries),
            "cache_hits": cls.cache_hits,
            "cache_misses": cls.cache_misses,
            "cache_hit_rate": cache_hit_rate
        }
    
    @classmethod
    def reset(cls):
        """Reset metrics"""
        cls.query_count = 0
        cls.total_query_time = 0.0
        cls.slow_queries = []
        cls.cache_hits = 0
        cls.cache_misses = 0


# Enhanced Engine with Connection Pooling
def create_optimized_engine():
    """
    Create database engine with optimized connection pooling
    SQLite doesn't support traditional pooling, but we can optimize it
    """
    engine = create_engine(
        config.get_database_url(),
        echo=config.DB_ECHO,
        connect_args={
            "check_same_thread": False,  # Allow multi-threading
            "timeout": 30,  # Connection timeout
            "isolation_level": None  # Autocommit mode for better concurrency
        },
        poolclass=StaticPool,  # Use StaticPool for SQLite
        pool_pre_ping=True  # Verify connections before use
    )
    
    # Add event listeners for query timing
    @event.listens_for(engine, "before_cursor_execute")
    def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
        conn.info.setdefault('query_start_time', []).append(time.time())
    
    @event.listens_for(engine, "after_cursor_execute")
    def receive_after_cursor_execute(conn, cursor, statement, params, context, executemany):
        total = time.time() - conn.info['query_start_time'].pop()
        DBMetrics.record_query(total, statement)
    
    return engine


# Transaction Context Manager
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Get database session with automatic transaction management
    Usage:
        with get_db_session() as session:
            session.add(entity)
            # Automatic commit on success, rollback on error
    """
    session = Session(optimized_engine)
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database transaction failed: {e}")
        raise
    finally:
        session.close()


@contextmanager
def get_readonly_session() -> Generator[Session, None, None]:
    """
    Get read-only database session (no commit needed)
    Usage:
        with get_readonly_session() as session:
            results = session.exec(select(Deal))
    """
    session = Session(optimized_engine)
    try:
        yield session
    finally:
        session.close()


# Performance Timing Decorator
def timed_operation(operation_name: str):
    """
    Decorator to time database operations
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"{operation_name} completed in {elapsed:.3f}s")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"{operation_name} failed after {elapsed:.3f}s: {e}")
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"{operation_name} completed in {elapsed:.3f}s")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"{operation_name} failed after {elapsed:.3f}s: {e}")
                raise
        
        # Return appropriate wrapper based on function type
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Batch Operations
class BatchOperations:
    """Utilities for batch database operations"""
    
    @staticmethod
    @timed_operation("batch_insert")
    def batch_insert(entities: List[Any], batch_size: int = 1000):
        """
        Insert entities in batches for better performance
        
        Args:
            entities: List of SQLModel entities to insert
            batch_size: Number of entities per batch
        """
        total_inserted = 0
        
        with get_db_session() as session:
            for i in range(0, len(entities), batch_size):
                batch = entities[i:i + batch_size]
                session.bulk_save_objects(batch)
                total_inserted += len(batch)
                logger.info(f"Inserted batch: {total_inserted}/{len(entities)}")
        
        return total_inserted
    
    @staticmethod
    @timed_operation("batch_update")
    def batch_update(model_class: type, updates: List[Dict[str, Any]], batch_size: int = 500):
        """
        Update entities in batches
        
        Args:
            model_class: SQLModel class
            updates: List of dicts with 'id' and fields to update
            batch_size: Number of updates per batch
        """
        total_updated = 0
        
        with get_db_session() as session:
            for i in range(0, len(updates), batch_size):
                batch = updates[i:i + batch_size]
                for update_data in batch:
                    entity_id = update_data.pop('id')
                    session.query(model_class).filter(
                        model_class.id == entity_id
                    ).update(update_data)
                total_updated += len(batch)
                logger.info(f"Updated batch: {total_updated}/{len(updates)}")
        
        return total_updated


# Query Optimization Utilities
def create_indexes():
    """
    Create database indexes for frequently queried fields
    This should be called during initialization
    """
    from models.database import Deal, TripPlan, PriceWatch, Conversation
    
    indexes = [
        # Deal indexes
        Index('idx_deal_type_price', Deal.type, Deal.price),
        Index('idx_deal_active_score', Deal.active, Deal.score),
        Index('idx_deal_expires', Deal.expires_at),
        
        # TripPlan indexes
        Index('idx_trip_user_created', TripPlan.user_id, TripPlan.created_at),
        Index('idx_trip_cost', TripPlan.total_cost),
        
        # PriceWatch indexes
        Index('idx_watch_user_active', PriceWatch.user_id, PriceWatch.active),
        Index('idx_watch_deal_active', PriceWatch.deal_id, PriceWatch.active),
        
        # Conversation indexes
        Index('idx_conv_user_created', Conversation.user_id, Conversation.created_at),
        Index('idx_conv_intent', Conversation.intent)
    ]
    
    with get_db_session() as session:
        for index in indexes:
            try:
                index.create(session.bind, checkfirst=True)
                logger.info(f"Created index: {index.name}")
            except Exception as e:
                logger.warning(f"Index creation skipped for {index.name}: {e}")


# Query result caching
def optimize_deal_query(query_params: Dict[str, Any]) -> str:
    """
    Generate optimized SQL for deal queries
    
    Args:
        query_params: Dict with type, min_price, max_price, tags, etc.
    
    Returns:
        Optimized SQL query string
    """
    conditions = ["active = 1"]
    
    if query_params.get('type'):
        conditions.append(f"type = '{query_params['type']}'")
    
    if query_params.get('min_price'):
        conditions.append(f"price >= {query_params['min_price']}")
    
    if query_params.get('max_price'):
        conditions.append(f"price <= {query_params['max_price']}")
    
    if query_params.get('min_score'):
        conditions.append(f"score >= {query_params['min_score']}")
    
    where_clause = " AND ".join(conditions)
    
    # Use covering index for better performance
    query = f"""
        SELECT id, deal_id, type, title, price, score, tags, deal_metadata
        FROM deals
        WHERE {where_clause}
        ORDER BY score DESC, price ASC
        LIMIT {query_params.get('limit', 100)}
    """
    
    return query


# Initialize optimized engine
optimized_engine = create_optimized_engine()


# Health check utilities
def check_db_health() -> Dict[str, Any]:
    """
    Check database health and connection status
    """
    try:
        with get_readonly_session() as session:
            # Test query
            result = session.exec(text("SELECT 1")).first()
            
            # Get table counts
            from models.database import Deal, TripPlan, PriceWatch
            deal_count = session.query(Deal).count()
            trip_count = session.query(TripPlan).count()
            watch_count = session.query(PriceWatch).count()
            
            return {
                "status": "healthy",
                "connection": "ok",
                "deals_count": deal_count,
                "trips_count": trip_count,
                "watches_count": watch_count,
                "metrics": DBMetrics.get_stats()
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# Cleanup utilities
def cleanup_old_data(days: int = 30):
    """
    Clean up old data to maintain performance
    
    Args:
        days: Number of days to keep
    """
    from models.database import Conversation, PriceHistory
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    with get_db_session() as session:
        # Clean old conversations
        old_conversations = session.query(Conversation).filter(
            Conversation.created_at < cutoff_date
        ).delete()
        
        # Clean old price history
        old_prices = session.query(PriceHistory).filter(
            PriceHistory.recorded_at < cutoff_date
        ).delete()
        
        logger.info(f"Cleaned up {old_conversations} conversations and {old_prices} price records")
        
        return {
            "conversations_deleted": old_conversations,
            "price_history_deleted": old_prices
        }
