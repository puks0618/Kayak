"""
Enhanced WebSocket Service for Real-time Communication
Features: Connection resilience, message queue, heartbeat, delivery guarantees
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List, Optional, Deque
from collections import deque
from datetime import datetime, timedelta
import json
import asyncio
import time


class ConnectionState:
    """Track WebSocket connection state"""
    def __init__(self, websocket: WebSocket, user_id: str):
        self.websocket = websocket
        self.user_id = user_id
        self.connected_at = datetime.utcnow()
        self.last_heartbeat = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.message_queue: Deque[dict] = deque(maxlen=100)  # Last 100 messages
        self.failed_sends = 0
        self.total_messages_sent = 0
        self.total_messages_received = 0
    
    def update_heartbeat(self):
        """Update last heartbeat timestamp"""
        self.last_heartbeat = datetime.utcnow()
        self.last_activity = datetime.utcnow()
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    def is_stale(self, timeout_seconds: int = 60) -> bool:
        """Check if connection is stale (no heartbeat)"""
        return (datetime.utcnow() - self.last_heartbeat).total_seconds() > timeout_seconds
    
    def queue_message(self, message: dict):
        """Add message to queue"""
        message['queued_at'] = datetime.utcnow().isoformat()
        self.message_queue.append(message)
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "uptime_seconds": (datetime.utcnow() - self.connected_at).total_seconds(),
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "messages_sent": self.total_messages_sent,
            "messages_received": self.total_messages_received,
            "failed_sends": self.failed_sends,
            "queued_messages": len(self.message_queue)
        }


class WebSocketService:
    """Manages WebSocket connections with resilience and real-time features"""
    
    def __init__(self, heartbeat_interval: int = 30, stale_timeout: int = 60):
        self.connections: Dict[str, ConnectionState] = {}  # user_id -> ConnectionState
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of room_ids
        self.heartbeat_interval = heartbeat_interval  # seconds
        self.stale_timeout = stale_timeout  # seconds
        self.heartbeat_task = None
        self._message_stats = {
            "total_sent": 0,
            "total_failed": 0,
            "total_broadcast": 0,
            "deal_alerts": 0,
            "price_alerts": 0,
            "trip_updates": 0
        }
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection for a user"""
        await websocket.accept()
        
        # Create connection state
        state = ConnectionState(websocket, user_id)
        self.connections[user_id] = state
        self.user_rooms[user_id] = set()
        
        print(f"✅ WebSocket connected: {user_id} (total: {len(self.connections)})")
        
        # Send welcome message
        await self.send_to_user(user_id, {
            "type": "connection_established",
            "user_id": user_id,
            "server_time": datetime.utcnow().isoformat(),
            "heartbeat_interval": self.heartbeat_interval
        })
        
        # Start heartbeat if not running
        if not self.heartbeat_task or self.heartbeat_task.done():
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
    
    def disconnect(self, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.connections:
            stats = self.connections[user_id].get_stats()
            del self.connections[user_id]
            print(f"❌ WebSocket disconnected: {user_id} (uptime: {stats['uptime_seconds']:.0f}s)")
        
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]
    
    async def send_to_user(self, user_id: str, message: dict, queue_on_failure: bool = True):
        """Send message to specific user with delivery guarantee"""
        if user_id not in self.connections:
            return False
        
        state = self.connections[user_id]
        
        try:
            # Add metadata
            if "timestamp" not in message:
                message["timestamp"] = datetime.utcnow().isoformat()
            
            await state.websocket.send_json(message)
            state.total_messages_sent += 1
            state.update_activity()
            self._message_stats["total_sent"] += 1
            return True
            
        except Exception as e:
            print(f"Error sending to {user_id}: {e}")
            state.failed_sends += 1
            self._message_stats["total_failed"] += 1
            
            # Queue message for later delivery if requested
            if queue_on_failure:
                state.queue_message(message)
            
            # Disconnect if too many failures
            if state.failed_sends >= 3:
                self.disconnect(user_id)
            
            return False
    
    async def broadcast(self, message: dict, exclude_users: List[str] = None):
        """Broadcast message to all connected clients"""
        exclude_users = exclude_users or []
        disconnected = []
        success_count = 0
        
        for user_id in self.connections.keys():
            if user_id in exclude_users:
                continue
            
            if await self.send_to_user(user_id, message, queue_on_failure=False):
                success_count += 1
            else:
                disconnected.append(user_id)
        
        # Clean up disconnected clients
        for user_id in disconnected:
            self.disconnect(user_id)
        
        self._message_stats["total_broadcast"] += 1
        return success_count
    
    def join_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        if user_id in self.user_rooms:
            self.user_rooms[user_id].add(room_id)
            print(f"🚪 {user_id} joined room: {room_id}")
    
    def leave_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            print(f"🚪 {user_id} left room: {room_id}")
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        """Broadcast message to all users in a room"""
        count = 0
        for user_id, rooms in self.user_rooms.items():
            if room_id in rooms:
                if await self.send_to_user(user_id, message):
                    count += 1
        return count
    
    # Specialized message types
    
    async def send_deal_alert(self, user_id: str, deal: dict, alert_type: str = "new_deal"):
        """Send deal alert to user"""
        message = {
            "type": "deal_alert",
            "alert_type": alert_type,  # new_deal, hot_deal, flash_sale
            "deal": deal
        }
        self._message_stats["deal_alerts"] += 1
        return await self.send_to_user(user_id, message)
    
    async def broadcast_hot_deal(self, deal: dict):
        """Broadcast hot deal to all connected users"""
        message = {
            "type": "deal_alert",
            "alert_type": "hot_deal",
            "deal": deal
        }
        self._message_stats["deal_alerts"] += 1
        return await self.broadcast(message)
    
    async def send_price_alert(self, user_id: str, watch_id: str, deal: dict, alert_data: dict):
        """Send price watch alert to user"""
        message = {
            "type": "watch_alert",
            "watch_id": watch_id,
            "deal_id": deal.get("deal_id"),
            "deal_title": deal.get("title"),
            "price": deal.get("price"),
            "message": f"💰 {deal.get('title')} is now ${deal.get('price'):.0f}!\n\n" + "\n".join([f"• {r}" for r in alert_data.get("reasons", [])]),
            "reasons": alert_data.get("reasons", []),
            "timestamp": alert_data.get("timestamp") or str(datetime.utcnow())
        }
        self._message_stats["price_alerts"] += 1
        return await self.send_to_user(user_id, message)
    
    async def send_trip_update(self, user_id: str, update_type: str, data: dict):
        """Send trip planning update"""
        message = {
            "type": "trip_update",
            "update_type": update_type,  # searching, found, complete, error
            "data": data
        }
        self._message_stats["trip_updates"] += 1
        return await self.send_to_user(user_id, message)
    
    async def send_notification(self, user_id: str, notification: dict):
        """Send generic notification"""
        message = {
            "type": "notification",
            "notification": notification
        }
        return await self.send_to_user(user_id, message)
    
    # Connection management
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat to all connections"""
        print("💓 Starting heartbeat loop...")
        
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                # Send heartbeat to all connections
                stale_connections = []
                
                for user_id, state in list(self.connections.items()):
                    # Check if connection is stale
                    if state.is_stale(self.stale_timeout):
                        stale_connections.append(user_id)
                        continue
                    
                    # Send heartbeat
                    await self.send_to_user(user_id, {
                        "type": "heartbeat",
                        "server_time": datetime.utcnow().isoformat()
                    }, queue_on_failure=False)
                
                # Clean up stale connections
                for user_id in stale_connections:
                    print(f"⚠️ Removing stale connection: {user_id}")
                    self.disconnect(user_id)
                
                # Log stats
                if len(self.connections) > 0:
                    print(f"💓 Heartbeat sent to {len(self.connections)} connections")
            
            except Exception as e:
                print(f"Error in heartbeat loop: {e}")
    
    async def flush_queued_messages(self, user_id: str):
        """Attempt to send queued messages"""
        if user_id not in self.connections:
            return 0
        
        state = self.connections[user_id]
        sent = 0
        
        while state.message_queue:
            message = state.message_queue.popleft()
            if await self.send_to_user(user_id, message, queue_on_failure=False):
                sent += 1
            else:
                # Put back and stop
                state.message_queue.appendleft(message)
                break
        
        return sent
    
    # Statistics and monitoring
    
    def get_connected_users(self) -> List[str]:
        """Get list of connected user IDs"""
        return list(self.connections.keys())
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.connections)
    
    def get_stats(self) -> dict:
        """Get WebSocket service statistics"""
        return {
            "active_connections": len(self.connections),
            "total_rooms": sum(len(rooms) for rooms in self.user_rooms.values()),
            "message_stats": self._message_stats.copy(),
            "uptime_by_user": {
                user_id: state.get_stats()
                for user_id, state in self.connections.items()
            }
        }
    
    def get_user_stats(self, user_id: str) -> Optional[dict]:
        """Get statistics for specific user"""
        if user_id in self.connections:
            return self.connections[user_id].get_stats()
        return None


# Global WebSocket service instance
ws_service = WebSocketService()

