"""
WebSocket Service for Real-time Communication
"""

from fastapi import WebSocket
from typing import List

class WebSocketService:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            await connection.send_json(message)
    
    async def send_to_client(self, websocket: WebSocket, message: dict):
        """Send message to specific client"""
        await websocket.send_json(message)

