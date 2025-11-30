#!/bin/bash
# Restart listing service script

echo "Stopping listing service on port 3002..."
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 2

echo "Starting listing service..."
cd "/Users/keith/Documents/MS DA Study/DATA 236-Distributed Systems/Kayak/kayak-microservices/services/listing-service"
PORT=3002 npm start

