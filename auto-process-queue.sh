#!/bin/bash
# Automated Queue Processor
# This script checks for pending webhook requests and processes them
# It's designed to be called by George or via cron

QUEUE_DIR="/data/.openclaw/workspace/webhook-queue"
SESSION_STORE="/data/.openclaw/workspace/agent-sessions.json"
LOG_FILE="/data/.openclaw/workspace/webhook-processor.log"

# Check if queue has files
PENDING=$(find "$QUEUE_DIR" -name "*.json" -type f 2>/dev/null | wc -l)

if [ "$PENDING" -eq 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Queue empty" >> "$LOG_FILE"
  exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Processing $PENDING requests" >> "$LOG_FILE"

# Process each request
for request_file in "$QUEUE_DIR"/*.json; do
  [ -e "$request_file" ] || continue
  
  filename=$(basename "$request_file")
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Processing $filename" >> "$LOG_FILE"
  
  # Read request
  action=$(jq -r '.action' "$request_file")
  agent_id=$(jq -r '.agentId' "$request_file")
  
  if [ "$action" = "spawn" ]; then
    # Handle spawn request
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Spawn request for $agent_id" >> "$LOG_FILE"
    
    # Check if already spawned
    session_key=$(jq -r --arg agent "$agent_id" '.[$agent] // empty' "$SESSION_STORE" 2>/dev/null)
    
    if [ -n "$session_key" ]; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') - Agent $agent_id already spawned: $session_key" >> "$LOG_FILE"
      # TODO: Signal George to verify session still active
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') - Need to spawn $agent_id" >> "$LOG_FILE"
      # TODO: Signal George to spawn via sessions_spawn
    fi
    
  elif [ "$action" = "message" ]; then
    # Handle message request
    message=$(jq -r '.message' "$request_file")
    session_key=$(jq -r '.sessionKey' "$request_file")
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Message to $agent_id ($session_key): ${message:0:50}..." >> "$LOG_FILE"
    # TODO: Signal George to send via sessions_send
  fi
done

echo "$(date '+%Y-%m-%d %H:%M:%S') - Queue processing complete" >> "$LOG_FILE"
