# Manual Queue Processing Guide

## Quick Process

When you see pending requests, process them with this flow:

### 1. Check Queue Status

```bash
cd /data/.openclaw/workspace/dashboard-queue
./check-queue.sh
```

### 2. For Each Pending Request

#### Read the request:
```bash
cat requests/<filename>.json
```

Extract: `requestId`, `agentId`, `message`

#### Check if agent has active session:
```bash
cat sessions.json
```

#### Option A: Agent Has Recent Session (< 2 min old)

Use `sessions_send`:
```javascript
sessions_send({
  sessionKey: "<sessionKey from sessions.json>",
  message: "<message from request>"
})
```

#### Option B: No Active Session

Use `sessions_spawn`:
```javascript
const result = await sessions_spawn({
  task: "<message>",
  label: "<agentId>-dashboard",
  model: "<model for agent>",
  cwd: "<workspace for agent>",
  mode: "run",
  runTimeoutSeconds: 120
});

// Save session key to sessions.json
```

Models:
- scout: anthropic/claude-haiku-4-5
- ryan: anthropic/claude-sonnet-4-5
- brian: anthropic/claude-sonnet-4-5
- keisha: openai/gpt-4.1

### 3. Wait for Response

Agent will auto-announce completion. Capture the response.

### 4. Write Response File

```bash
./complete-request.sh "<requestId>" "<agent's response>"
```

### 5. Update sessions.json

```json
{
  "<agentId>": {
    "sessionKey": "<from spawn result>",
    "label": "<agentId>-dashboard",
    "createdAt": <timestamp>,
    "lastUsed": <timestamp>,
    "messageCount": <count>
  }
}
```

### 6. Clean Up Request File

```bash
mv requests/<filename>.json processing/
```

## Automation Plan

Later: Add this to my heartbeat checks every 30-60 seconds.

For now: Manual processing when you notice requests in queue.
