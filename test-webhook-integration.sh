#!/bin/bash
# End-to-End Webhook Integration Test
# Tests the complete flow: Queue → Process → Spawn/Message → Response

set -e

QUEUE_DIR="/data/.openclaw/workspace/webhook-queue"
RESPONSES_DIR="/data/.openclaw/workspace/webhook-responses"
SESSION_STORE="/data/.openclaw/workspace/agent-sessions.json"

echo "=== Webhook Integration Test ==="
echo ""

# Clean up previous test artifacts
echo "1. Cleaning up previous test data..."
rm -f "$QUEUE_DIR"/*.json
rm -f "$RESPONSES_DIR"/*.json
echo "   ✓ Queue cleared"

# Reset session store
echo "{}" > "$SESSION_STORE"
echo "   ✓ Session store reset"

# Create test spawn request
echo ""
echo "2. Creating test spawn request for 'testbot'..."
cat > "$QUEUE_DIR/spawn-testbot-$(date +%s).json" <<EOF
{
  "action": "spawn",
  "agentId": "testbot",
  "type": "persistent",
  "model": "anthropic/claude-sonnet-4-5",
  "workspace": "/data/.openclaw/workspace/agents/testbot",
  "memory": "/data/.openclaw/workspace/agents/testbot/memory.md",
  "callbackUrl": null
}
EOF
echo "   ✓ Spawn request queued"

# Verify queue
QUEUE_COUNT=$(ls -1 "$QUEUE_DIR"/*.json 2>/dev/null | wc -l)
echo "   ✓ Queue contains $QUEUE_COUNT request(s)"

echo ""
echo "3. Processing queue..."
node /data/.openclaw/workspace/webhook-queue-processor.js

echo ""
echo "=== Test Setup Complete ==="
echo "Next: George should process these requests using OpenClaw tools"
echo "Expected actions:"
echo "  - Spawn agent 'testbot'"
echo "  - Store session key in agent-sessions.json"
echo "  - Send callback (if URL provided)"
echo ""
