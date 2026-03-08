#!/bin/bash
# Log agent activity to dashboard SQLite via API
# Usage: ./log-activity.sh <agent_name> <task_description> [model] [status] [source]
AGENT="${1:?agent_name required}"
TASK="${2:?task_description required}"
MODEL="${3:-unknown}"
STATUS="${4:-completed}"
SOURCE="${5:-telegram}"

curl -s -X POST http://187.77.8.165/api/logs \
  -H 'Content-Type: application/json' \
  -d "{\"agent_name\":\"$AGENT\",\"task_description\":\"$TASK\",\"model_used\":\"$MODEL\",\"status\":\"$STATUS\",\"source\":\"$SOURCE\"}"
