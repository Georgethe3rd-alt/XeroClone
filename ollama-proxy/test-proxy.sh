#!/bin/bash
# Test script for Ollama OpenAI Proxy

PROXY_URL="${1:-http://localhost:11435}"

echo "=== Testing Ollama OpenAI Proxy ==="
echo "Proxy URL: $PROXY_URL"
echo

echo "1. Health check..."
curl -s "${PROXY_URL}/health" | jq . || echo "Failed"
echo

echo "2. List models..."
curl -s "${PROXY_URL}/v1/models" | jq '.data[].id' || echo "Failed"
echo

echo "3. Test chat completion..."
curl -s -X POST "${PROXY_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in one sentence."}
    ],
    "temperature": 0.7,
    "max_tokens": 50
  }' | jq '.choices[0].message.content' || echo "Failed"
echo

echo "=== Test Complete ==="
