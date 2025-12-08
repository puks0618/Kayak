#!/bin/bash

# Initialize Ollama with required models
# This script runs after Ollama container starts

echo "🤖 Initializing Ollama..."

# Wait for Ollama to be ready
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "⏳ Waiting for Ollama to start..."
    sleep 2
done

echo "✅ Ollama is ready!"

# Pull the llama3.2 model
echo "📥 Pulling llama3.2 model..."
docker exec kayak-ollama ollama pull llama3.2

echo "✅ Model pulled successfully!"

# Verify model is available
echo "🔍 Verifying models..."
docker exec kayak-ollama ollama list

echo "✅ Ollama initialization complete!"
