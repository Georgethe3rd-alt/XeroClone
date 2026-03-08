# George Message Routing - Architecture

**Updated**: 2026-03-08 07:38 EDT

## Problem

Dashboard has a "George" agent, but we don't want to spawn a NEW George instance. We want messages to route to the MAIN George session (the OpenClaw instance running in the container).

## Solution

Messages to "george" follow a special routing path:

```
Dashboard User → George agent
    ↓
Webhook Service (writes to queue)
    ↓
Queue Processor (detects agentId === 'george')
    ↓
Move to george-inbox/ (separate from spawn queue)
    ↓
George checks inbox periodically (via heartbeat)
    ↓
George processes message in main session
    ↓
George sends response via callback
    ↓
Dashboard receives response
    ↓
User sees George's reply
```

## Components

### 1. Webhook Queue Processor
**File**: `/data/.openclaw/workspace/webhook-queue-processor.js`

When processing messages:
- If `agentId === 'george'` → mark as `route_to_main`
- Other agents → spawn via `sessions_spawn` or send via `sessions_send`

### 2. George Message Processor
**File**: `/data/.openclaw/workspace/process-george-messages.js`

**Commands**:
```bash
# Extract George messages from main queue to inbox
node process-george-messages.js extract

# List pending messages for George
node process-george-messages.js list

# Respond to a specific message
node process-george-messages.js respond <file> <response-text>

# Auto mode (extract + list)
node process-george-messages.js
```

### 3. George Inbox/Outbox
**Directories**:
- `/data/.openclaw/workspace/george-inbox/` - Pending messages for George
- `/data/.openclaw/workspace/george-outbox/` - George's sent responses

### 4. Heartbeat Integration
**File**: `/data/.openclaw/workspace/HEARTBEAT.md`

George checks inbox every few heartbeats and processes messages.

## Workflow Example

### Step 1: User sends message via dashboard

Dashboard sends:
```json
{
  "action": "message",
  "agentId": "george",
  "message": "What's the weather today?",
  "callbackUrl": "http://187.77.217.138:3004/webhook/agent-callback"
}
```

### Step 2: Webhook writes to queue

File: `/data/.openclaw/workspace/webhook-queue/message-george-1741435200000.json`

### Step 3: Queue processor detects George message

```bash
node webhook-queue-processor.js
# Output: { action: "route_to_main", agentId: "george", ... }
```

### Step 4: George message processor extracts

```bash
node process-george-messages.js extract
# Moves file from webhook-queue/ to george-inbox/
```

### Step 5: George checks inbox (via heartbeat)

```bash
node process-george-messages.js list
# Output: 1 pending message from dashboard
```

### Step 6: George processes in main session

George (in this session) sees the message and responds using normal OpenClaw capabilities.

### Step 7: George sends response

```bash
node process-george-messages.js respond message-george-1741435200000.json \
  "The weather today is sunny, 72°F with light winds."
```

### Step 8: Callback sent to dashboard

POST to `http://187.77.217.138:3004/webhook/agent-callback`:
```json
{
  "type": "agent_response",
  "agentId": "george",
  "message": "The weather today is sunny, 72°F with light winds.",
  "timestamp": 1741435205000
}
```

### Step 9: Dashboard updates UI

User sees George's response in the chat.

## Advantages

1. **Single George Instance**: No spawning duplicate Georges
2. **Main Session Context**: George has access to full workspace, memory, tools
3. **Orchestration Power**: George can spawn/manage Ryan, Brian, Keisha from here
4. **Telegram Integration**: George's main conversation stays on Telegram, dashboard is secondary interface

## Testing

### Create a test message

```bash
cat > /data/.openclaw/workspace/webhook-queue/test-george-$(date +%s).json <<'EOF'
{
  "action": "message",
  "agentId": "george",
  "message": "Hello George, this is a test from the dashboard.",
  "callbackUrl": null,
  "timestamp": 1741435200000
}
EOF
```

### Extract and list

```bash
node /data/.openclaw/workspace/process-george-messages.js extract
node /data/.openclaw/workspace/process-george-messages.js list
```

### Respond

```bash
node /data/.openclaw/workspace/process-george-messages.js respond \
  test-george-1741435200000.json \
  "Test received and acknowledged."
```

## Implementation Status

✅ Queue processor updated (detects George messages)  
✅ Message processor script created  
✅ Inbox/outbox directories created  
✅ Heartbeat integration documented  
⏳ Automated processing (manual for now, can be triggered via heartbeat)  
⏳ Dashboard testing needed  

## Next Steps

1. Test with real dashboard message
2. Verify callback delivery
3. Add to regular heartbeat checks
4. Document in dashboard docs

---

*Last updated: 2026-03-08 07:38 EDT*  
*Implemented by: George the 3rd*
