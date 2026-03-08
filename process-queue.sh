#!/bin/bash
# Queue Processor Orchestrator
# This script is called by George to process webhook queue requests
# It outputs the structured plan, which George then executes using tools

set -e

QUEUE_PROCESSOR="/data/.openclaw/workspace/webhook-queue-processor.js"
SESSION_STORE="/data/.openclaw/workspace/agent-sessions.json"
QUEUE_DIR="/data/.openclaw/workspace/webhook-queue"
RESPONSES_DIR="/data/.openclaw/workspace/webhook-responses"

# Ensure directories exist
mkdir -p "$QUEUE_DIR" "$RESPONSES_DIR"

# Run the processor to get the plan
node "$QUEUE_PROCESSOR"
