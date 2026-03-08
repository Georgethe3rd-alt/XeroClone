#!/bin/bash
# Helper to complete a request with a response
# Usage: ./complete-request.sh <requestId> <response-message>

REQUEST_ID="$1"
RESPONSE_MESSAGE="$2"

if [ -z "$REQUEST_ID" ] || [ -z "$RESPONSE_MESSAGE" ]; then
  echo "Usage: $0 <requestId> <response-message>"
  exit 1
fi

RESPONSE_FILE="/data/.openclaw/workspace/dashboard-queue/responses/${REQUEST_ID}.json"

cat > "$RESPONSE_FILE" << EOF
{
  "requestId": "$REQUEST_ID",
  "status": "done",
  "response": "$RESPONSE_MESSAGE",
  "timestamp": $(date +%s)000
}
EOF

echo "Response written to $RESPONSE_FILE"
