# Dashboard ↔ OpenClaw Integration Plan

## Current State (Before)

**Dashboard**:
- Maintains own `agents` object with hardcoded state
- Messages go to webhook (172.18.0.2:3005) which may or may not work
- No real-time status from OpenClaw
- State diverges from reality

**OpenClaw**:
- Has `agents.list` config with agent definitions
- Manages active sessions independently
- Dashboard doesn't know about OpenClaw's state

**Gap**: Two separate systems, no synchronization

---

## Target State (After)

**Dashboard** becomes a **frontend UI layer**:
- Queries OpenClaw sessions API for real agent status
- Routes messages via OpenClaw RPC (sessions.send / sessions.spawn)
- Shows conversation history from OpenClaw sessions
- Updates agent status every 5 seconds from OpenClaw

**OpenClaw** remains the **source of truth**:
- agents.list defines all agents (main, scout, ryan, brian, keisha)
- Active sessions tracked by OpenClaw
- All agent state lives here

**Integration**: `OpenClawBridge` class handles all communication

---

## Implementation Steps

### ✅ Step 1: Create Agent Definitions in OpenClaw
- [x] Add ryan, brian, keisha to openclaw.json agents.list
- [x] Scout already exists
- [x] Main already exists
- [x] All dashboard agents now have OpenClaw counterparts

### 🔄 Step 2: Build Integration Bridge
- [x] Created `openclaw-bridge.js` with RPC methods:
  - getSessions() - fetch active sessions
  - getSessionHistory() - get conversation history
  - sendMessage() - send to existing session
  - spawnAgent() - create new session
  - mapSessionsToAgents() - sync state

### ⏳ Step 3: Update Dashboard Server
- [ ] Import OpenClawBridge
- [ ] Initialize bridge with gateway URL + token
- [ ] Replace static agents object with dynamic queries
- [ ] Update /api/agents endpoint to query OpenClaw
- [ ] Update POST /api/agents/:id/message to use bridge
- [ ] Add periodic status polling (5sec interval)
- [ ] Update SSE /api/agents/:id/stream to use OpenClaw sessions

### ⏳ Step 4: Update Dashboard Frontend
- [ ] No changes needed if API contract stays the same
- [ ] Already polls /api/agents for status
- [ ] Already sends to /api/agents/:id/message

### ⏳ Step 5: Testing
- [ ] Verify agent list shows correct status
- [ ] Test sending message creates OpenClaw session
- [ ] Verify conversation history loads from OpenClaw
- [ ] Check status updates in real-time
- [ ] Test all 5 agents (scout, ryan, brian, keisha, lama)

---

## Architecture Diagram

```
┌─────────────────┐
│  Browser (You)  │
└────────┬────────┘
         │ HTTP/SSE
         │
         ▼
┌─────────────────────────────────────┐
│  Dashboard (187.77.8.165:80)        │
│  - Express server                   │
│  - OpenClawBridge                   │
│  - Frontend HTML/JS                 │
└────────┬────────────────────────────┘
         │ RPC (sessions.*, config.*)
         │ http://172.18.0.2:18789/rpc
         │
         ▼
┌─────────────────────────────────────┐
│  OpenClaw Gateway (172.18.0.2)      │
│  - Session management               │
│  - Agent spawning                   │
│  - Message routing                  │
│  - agents.list config               │
└─────────────────────────────────────┘
```

---

## API Changes

### Before (Static State)
```javascript
const agents = { george: {...}, ryan: {...} };
app.get('/api/agents', (req, res) => res.json(agents));
```

### After (Dynamic from OpenClaw)
```javascript
const bridge = new OpenClawBridge({...});
app.get('/api/agents', async (req, res) => {
  const sessions = await bridge.getSessions();
  const status = bridge.mapSessionsToAgents(sessions, agents);
  res.json(status);
});
```

---

## Benefits

1. **Single Source of Truth**: OpenClaw manages all agent state
2. **Real-Time Status**: Dashboard always shows current reality
3. **Conversation History**: Load from OpenClaw sessions, not fake data
4. **Proper Routing**: Messages actually reach the right agents
5. **Scalability**: Add new agents by updating openclaw.json only
6. **No State Drift**: Dashboard can't get out of sync

---

## Rollback Plan

If integration breaks:
1. Restore `/root/dashboard-host/server.js` from backup
2. Dashboard returns to static state (works but disconnected)
3. OpenClaw continues working independently

Backup location: `/root/dashboard-host/server.js.backup-pre-openclaw-integration`

---

## Next Action

Update dashboard server.js to use OpenClawBridge for all agent operations.
