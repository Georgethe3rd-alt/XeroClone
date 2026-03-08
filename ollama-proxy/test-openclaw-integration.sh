#!/bin/bash
# Safe test of Ollama proxy integration with OpenClaw
# Tests spawning an agent with local model WITHOUT touching George's config

set -e

echo "=== OpenClaw Ollama Integration Test ==="
echo

# Test 1: Can OpenClaw reach the proxy?
echo "Test 1: Network connectivity to proxy from OpenClaw container"
if curl -s http://172.17.0.1:11435/health | jq . 2>/dev/null; then
    echo "✓ Proxy reachable from this container"
else
    echo "✗ Cannot reach proxy"
    exit 1
fi

echo
echo "Test 2: Check available models via proxy"
if curl -s http://172.17.0.1:11435/v1/models | jq -r '.data[].id' 2>/dev/null; then
    echo "✓ Proxy models endpoint working"
else
    echo "✗ Models endpoint failed"
    exit 1
fi

echo
echo "Test 3: Direct API test (bypass OpenClaw)"
RESPONSE=$(curl -s -X POST http://172.17.0.1:11435/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "messages": [{"role": "user", "content": "Reply with just the word TEST"}],
    "max_tokens": 10
  }' | jq -r '.choices[0].message.content' 2>/dev/null)

if [ -n "$RESPONSE" ]; then
    echo "✓ Direct completion successful: $RESPONSE"
else
    echo "✗ Direct completion failed"
    exit 1
fi

echo
echo "=== All Pre-Integration Tests Passed ==="
echo
echo "Next step: Configure OpenClaw to use this proxy"
echo "This requires modifying ~/.config/openclaw/config.yaml"
echo
echo "Safe approach:"
echo "1. Add proxy as 'openai' provider with custom baseUrl"
echo "2. Test with sessions_spawn using explicit model name"
echo "3. If it fails, spawned agent dies but George stays intact"
echo
echo "Risky approach (DON'T DO):"
echo "1. Change default model system-wide"
echo "2. Restart OpenClaw gateway"
echo "3. If it breaks, George is broken too"
