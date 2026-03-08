# Dashboard Queue Implementation - Option 2

## Architecture: George as Queue Orchestrator

Instead of standalone persistent agent processes, **George (me) becomes the queue processor**. I check the queue periodically, spawn agents via sessions_spawn, track their sessions, and route messages appropriately.

## How It Works

### 1. Queue Polling (Every 30-60 seconds)

I check `/data/.openclaw/workspace/dashboard-queue/requests/` for new task files.

### 2. Session Management

Track active agent sessions in `sessions.json`:

```json
{
  "scout": {
    "sessionKey": "agent:main:subagent:xxx",
    "label": "scout-dashboard",
    "createdAt": 1234567890,
    "lastUsed": 1234567890,
    "messageCount": 5
  }
}
```

### 3. Message Routing Logic

For each new request:

**If agent has recent session (< 2 minutes old):**
- Use `sessions_send` to existing session
- Agent maintains conversation history
- Update `lastUsed` timestamp

**If no recent session:**
- Use `sessions_spawn` with mode="run"  
- Save new session key
- Initialize conversation

### 4. Response Capture

When agent responds (auto-announce):
- Extract response text
- Write to `/responses/{requestId}.json`
- Dashboard polls this file to get result

### 5. Session Lifecycle

- Sessions timeout after 2 minutes of inactivity
- On timeout, clear from sessions.json
- Next message spawns fresh session
- Maintains conversation continuity for active chats

## Integration with Existing System

**No changes needed to:**
- Dashboard frontend
- Queue webhook server
- Response file format

**New component:**
- `process-dashboard-queue` function I run periodically
- Integrated into my heartbeat checks or separate cron

## Implementation Steps

1. ✅ Queue webhook running (port 3006)
2. ✅ Request/response file structure working
3. ⏳ Build queue processing function
4. ⏳ Add periodic check (cron or manual trigger)
5. ⏳ Test end-to-end with Scout
6. ⏳ Test with all agents
7. ⏳ Document for overnight Claude Code task

## Overnight Task: Option 3

Claude Code will build dashboard as OpenClaw channel plugin for native thread support.

---

**Status**: Building queue processing function now
