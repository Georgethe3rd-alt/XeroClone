#!/bin/bash
# Check for pending dashboard requests

REQUESTS_DIR="/data/.openclaw/workspace/dashboard-queue/requests"
SESSIONS_FILE="/data/.openclaw/workspace/dashboard-queue/sessions.json"

echo "=== Dashboard Queue Status ==="
echo

# Count pending requests
PENDING=$(ls -1 "$REQUESTS_DIR"/*.json 2>/dev/null | wc -l)
echo "Pending requests: $PENDING"

if [ "$PENDING" -eq 0 ]; then
  echo "No pending requests to process."
  exit 0
fi

echo
echo "=== Pending Requests ==="
echo

# Show each request
for file in "$REQUESTS_DIR"/*.json; do
  if [ -f "$file" ]; then
    echo "File: $(basename "$file")"
    cat "$file" | jq -r '"Agent: \(.agentId)\nMessage: \(.message)\nRequestID: \(.requestId)"'
    echo
  fi
done

echo "=== Active Sessions ==="
if [ -f "$SESSIONS_FILE" ]; then
  cat "$SESSIONS_FILE" | jq -r 'to_entries[] | "\(.key): \(.value.sessionKey)"'
else
  echo "No sessions file (none started yet)"
fi

echo
echo "=== Instructions ==="
echo "For each request above:"
echo "1. Check if agent has active session in sessions.json"
echo "2. If yes: Use sessions_send with the message"
echo "3. If no: Use sessions_spawn with mode='session'"
echo "4. Save session key to sessions.json"
echo "5. When agent responds, run: ./complete-request.sh <requestId> <response>"
