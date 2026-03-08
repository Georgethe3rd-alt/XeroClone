# Overnight Task: Build Dashboard as OpenClaw Channel Plugin

**Priority**: Medium  
**Estimated Time**: 4-7 hours  
**Assigned To**: Claude Code  
**Due**: Tomorrow morning (2026-03-09)  

---

## Objective

Transform the existing dashboard at `http://187.77.8.165` from a file-queue-based system into a proper OpenClaw channel plugin with native thread support and persistent agent conversations.

---

## Current State

### What Works
- Dashboard UI at 187.77.8.165 shows 5 agents: George, Scout, Ryan, Brian, Keisha
- File-based queue system: Dashboard → Queue webhook (port 3006) → Request files → George processes → Response files → Dashboard
- Agents spawn via sessions_spawn, respond via auto-announce
- Conversation history is NOT maintained (each message spawns fresh)

### What's Missing
- Native OpenClaw integration (dashboard isn't a recognized channel)
- Thread mode support (requires channel plugin)
- Persistent agent sessions (sessions timeout quickly)
- Real-time status updates (dashboard polls, no WebSocket)

---

## Target Architecture

### Dashboard as Channel Plugin

The dashboard becomes an OpenClaw channel plugin like Telegram or Discord:

```
OpenClaw Core
├── channels/
│   ├── telegram/    (existing)
│   ├── discord/     (existing)
│   └── dashboard/   (NEW - you build this)
│       ├── index.js        (plugin entry point)
│       ├── dashboard-channel.js (channel implementation)
│       ├── http-server.js  (Express server)
│       └── public/         (frontend assets)
```

### Key Features

1. **Channel Registration**: Plugin registers with OpenClaw as "dashboard" channel
2. **Thread Support**: Each agent conversation is a thread (persistent sessions)
3. **Message Routing**: Dashboard messages route through OpenClaw's native message system
4. **Session Management**: OpenClaw handles agent sessions, not file-based tracking
5. **Real-Time Updates**: WebSocket for live agent status and message delivery

---

## Implementation Steps

### Phase 1: Study Existing Plugins (30-60 min)

**Read source code**:
- `/usr/local/lib/node_modules/openclaw/dist/plugins/telegram/` - reference implementation
- `/usr/local/lib/node_modules/openclaw/dist/core/plugin-manager.js` - plugin API
- `/usr/local/lib/node_modules/openclaw/docs/plugins.md` - documentation

**Understand**:
- Plugin lifecycle (load, initialize, start, stop)
- Channel hooks (onMessage, onDelivery, thread management)
- Authentication flow
- Message format (OpenClaw internal → dashboard format)

### Phase 2: Build Plugin Scaffold (1-2 hours)

**Create plugin structure**:
```
/usr/local/lib/node_modules/openclaw/dist/plugins/dashboard/
├── package.json          (plugin metadata)
├── index.js              (exports plugin object)
├── dashboard-channel.js  (implements Channel interface)
├── http-server.js        (Express + WebSocket server)
└── public/
    └── index.html        (copy from /root/dashboard-host/public/)
```

**Plugin manifest** (`package.json`):
```json
{
  "name": "@openclaw/plugin-dashboard",
  "version": "1.0.0",
  "openclaw": {
    "type": "channel",
    "id": "dashboard",
    "displayName": "Dashboard"
  }
}
```

**Entry point** (`index.js`):
```javascript
const DashboardChannel = require('./dashboard-channel');

module.exports = {
  name: 'dashboard',
  type: 'channel',
  load(openclaw) {
    return new DashboardChannel(openclaw);
  }
};
```

### Phase 3: Implement Channel Class (2-3 hours)

**DashboardChannel must implement**:

```javascript
class DashboardChannel {
  constructor(openclaw) {
    this.openclaw = openclaw;
    this.server = null;
  }

  async initialize(config) {
    // Start HTTP server on port 80
    // Set up WebSocket for real-time updates
    // Load agent definitions from OpenClaw config
  }

  async start() {
    // Begin listening for HTTP/WebSocket connections
  }

  async stop() {
    // Gracefully shut down server
  }

  // Message delivery from OpenClaw to dashboard
  async deliverMessage(message, context) {
    // Send agent response to dashboard via WebSocket
  }

  // Spawn thread for agent conversation
  async spawnThread(agentId, initialMessage) {
    // Use OpenClaw's native thread spawning
    // Return threadId for subsequent messages
  }

  // Send message to existing thread
  async sendToThread(threadId, message) {
    // Route message to OpenClaw thread
  }
}
```

### Phase 4: HTTP Server Implementation (1-2 hours)

**Requirements**:
- Serve static dashboard UI (port 80)
- WebSocket endpoint for real-time updates
- REST API endpoints:
  - GET /api/agents (list agents with real-time status)
  - POST /api/agents/:id/message (send message, create thread if needed)
  - GET /api/agents/:id/history (conversation history from OpenClaw)
  - WebSocket /ws (real-time status, message delivery)

**Authentication**:
- Use OpenClaw's gateway token for API auth
- WebSocket handshake validates token

### Phase 5: Frontend Integration (30-60 min)

**Minimal changes to existing dashboard**:
- Change API endpoints from old queue system to new plugin endpoints
- Add WebSocket connection for real-time updates
- Display agent status from OpenClaw sessions (active/idle/thinking)

### Phase 6: Testing (1-2 hours)

**Test cases**:
1. Dashboard loads, shows 5 agents
2. Send message to Scout, spawns thread, receives response
3. Send second message to Scout, uses same thread (conversation memory)
4. Send messages to Ryan, Brian, Keisha - all maintain separate threads
5. Check conversation history retrieval
6. Verify WebSocket delivers responses in real-time
7. Test multiple concurrent conversations

### Phase 7: Configuration & Deployment (30 min)

**OpenClaw config** (`~/.openclaw/openclaw.json`):
```json
{
  "channels": {
    "dashboard": {
      "enabled": true,
      "port": 80,
      "allowedIPs": ["0.0.0.0/0"],
      "agents": ["scout", "ryan", "brian", "keisha"]
    }
  }
}
```

**Deployment**:
1. Stop old dashboard service: `systemctl stop dashboard`
2. Enable plugin in OpenClaw config
3. Restart OpenClaw gateway: `openclaw gateway restart`
4. Dashboard now runs as OpenClaw plugin
5. Test from http://187.77.8.165

---

## Reference Material

### File Locations
- Old dashboard: `/root/dashboard-host/`
- OpenClaw plugins dir: `/usr/local/lib/node_modules/openclaw/dist/plugins/`
- OpenClaw docs: `/data/.openclaw/workspace/docs/`
- Agent configs: `/data/.openclaw/workspace/agents/{scout,ryan,brian,keisha}/`

### Agent Definitions
```javascript
const agents = {
  scout: { model: 'anthropic/claude-haiku-4-5', workspace: '/data/.openclaw/workspace/agents/heartbeat' },
  ryan: { model: 'anthropic/claude-sonnet-4-5', workspace: '/data/.openclaw/workspace/agents/ryan' },
  brian: { model: 'anthropic/claude-sonnet-4-5', workspace: '/data/.openclaw/workspace/agents/brian' },
  keisha: { model: 'openai/gpt-4.1', workspace: '/data/.openclaw/workspace/agents/keisha' }
};
```

### OpenClaw Thread API
```javascript
// Spawn thread (persistent session)
openclaw.sessions.spawn({
  agentId: 'scout',
  message: 'Hello',
  mode: 'session',
  thread: true,
  channelThread: { id: 'dashboard-scout-123', channel: 'dashboard' }
});

// Send to thread
openclaw.sessions.send({
  threadId: 'dashboard-scout-123',
  message: 'Follow-up message'
});
```

---

## Success Criteria

✅ Dashboard loads at http://187.77.8.165  
✅ All 5 agents visible with real-time status  
✅ Sending message spawns persistent thread  
✅ Follow-up messages go to same thread (conversation memory works)  
✅ Conversation history retrieves from OpenClaw  
✅ WebSocket delivers responses in real-time  
✅ Multiple agents can have concurrent conversations  
✅ Old queue system no longer needed  

---

## Deliverables

1. **Plugin code** in `/usr/local/lib/node_modules/openclaw/dist/plugins/dashboard/`
2. **Documentation** explaining architecture and how it works
3. **Test results** demonstrating all success criteria pass
4. **Migration notes** for moving from queue system to plugin

---

## Notes for Claude Code

- You have full access to the VPS via SSH (password: #Amariiwayne2018)
- OpenClaw is running in Docker container ID 6ea0a8860678
- Current dashboard runs as systemd service, will be replaced
- Study Telegram plugin thoroughly - it's the best reference
- Don't break George's main session (agent:main:main)
- Test extensively before calling it complete
- Document everything you learn about the plugin API

---

**Start Time**: Overnight (after George confirms queue system works)  
**Report Back**: Morning briefing with status update  

Good luck! 🚀
