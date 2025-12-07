"""
Enhanced WebSocket Service for Real-time Communication
"""

from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio

class WebSocketService:
    """Manages WebSocket connections with room/channel support"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of room_ids
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection for a user"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_rooms[user_id] = set()
        print(f"✅ WebSocket connected: {user_id}")
    
    def disconnect(self, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]
        print(f"❌ WebSocket disconnected: {user_id}")
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error sending to {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to {user_id}: {e}")
                disconnected.append(user_id)
        
        # Clean up disconnected clients
        for user_id in disconnected:
            self.disconnect(user_id)
    
    def join_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        if user_id in self.user_rooms:
            self.user_rooms[user_id].add(room_id)
    
    def leave_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        """Broadcast message to all users in a room"""
        for user_id, rooms in self.user_rooms.items():
            if room_id in rooms:
                await self.send_to_user(user_id, message)
    
    async def send_deal_alert(self, user_id: str, deal_event: dict):
        """Send deal alert to user"""
        message = {
            "type": "deal_alert",
            "data": deal_event
        }
        await self.send_to_user(user_id, message)
    
    async def send_price_alert(self, user_id: str, watch_id: str, alert_data: dict):
        """Send price watch alert to user"""
        message = {
            "type": "price_alert",
            "watch_id": watch_id,
            "data": alert_data
        }
        await self.send_to_user(user_id, message)
    
    def get_connected_users(self) -> list:
        """Get list of connected user IDs"""
        return list(self.active_connections.keys())


# Global WebSocket service instance
ws_service = WebSocketService()

