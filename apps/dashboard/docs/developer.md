# Developer Guide

Technical reference for extending and maintaining the OpenClaw Dashboard.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Frontend                      │
│                    (Browser / WebSocket)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/WS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Dashboard Backend (Express)                 │
│             server-webhook.js (port 80/3003)                │
│  • Authentication • WebSocket Server • Static Files         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP POST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Webhook Service (Express)                   │
│             dashboard-webhook.js (port 3001)                │
│  • Queue Writer • Session Tracker • Request Handler         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ File System
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Queue Directory                           │
│         /data/.openclaw/workspace/webhook-queue/            │
│                    (JSON files)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Processor Script
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                George (OpenClaw Agent)                       │
│          webhook-queue-processor.js                         │
│  • sessions_spawn • sessions_send • Callback POST           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Callback
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Backend (Callback Endpoint)           │
│           /webhook/agent-callback                           │
│  • Receives Response • Updates State • WebSocket Broadcast  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **HTML/CSS/JavaScript**: Vanilla (no framework)
- **WebSocket**: Real-time bidirectional communication
- **Fetch API**: HTTP requests for auth and docs

### Backend
- **Node.js**: v22+
- **Express**: Web server framework
- **ws**: WebSocket library
- **axios**: HTTP client for webhook calls

### Integration
- **OpenClaw Tools**: `sessions_spawn`, `sessions_send`
- **Queue System**: File-based JSON queue
- **Session Persistence**: JSON storage

## API Reference

### Authentication

#### POST `/api/auth`

Login and receive session token.

**Request**:
```json
{
  "password": "Wayne2026#"
}
```

**Response**:
```json
{
  "token": "hex-string-32-bytes"
}
```

**Status Codes**:
- `200` - Success
- `401` - Invalid password

---

### Agents

#### GET `/api/agents`

List all available agents and their status.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "george": {
    "name": "George",
    "type": "openclaw",
    "status": "online",
    "taskCount": 5,
    "messageCount": 42,
    "lastActive": 1741435200000
  },
  "ryan": {
    "name": "Ryan",
    "type": "openclaw-subagent",
    "status": "idle",
    "taskCount": 2,
    "messageCount": 8,
    "lastActive": 1741434800000
  }
}
```

---

#### GET `/api/agents/:id/messages`

Get message history for an agent.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "role": "user",
    "content": "Hello",
    "ts": 1741435200000,
    "agent": "george"
  },
  {
    "role": "assistant",
    "content": "Hello! How can I help?",
    "ts": 1741435202000,
    "agent": "george"
  }
]
```

**Limit**: Last 100 messages

---

#### POST `/api/agents/:id/spawn`

Manually spawn an agent (usually automatic on first message).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "sessionKey": "agent:main:subagent:uuid",
  "status": "online"
}
```

---

### Documentation

#### GET `/api/docs/:id`

Get rendered HTML documentation.

**Headers**: `Authorization: Bearer <token>`

**Parameters**:
- `id`: `user`, `technical`, `issues`, or `developer`

**Response**: HTML string (rendered from markdown)

---

### Webhook Endpoints

#### POST `/webhook/agent-callback`

Receives responses from George after processing agent requests.

**Request**:
```json
{
  "type": "spawn_complete",
  "agentId": "ryan",
  "sessionKey": "agent:main:subagent:uuid",
  "status": "online"
}
```

Or:

```json
{
  "type": "agent_response",
  "agentId": "ryan",
  "message": "Task complete. Here are the results..."
}
```

**Response**:
```json
{
  "received": true
}
```

---

## WebSocket Protocol

### Client → Server

#### Chat Message
```json
{
  "type": "chat",
  "agent": "ryan",
  "message": "Your message here"
}
```

### Server → Client

#### Initial State
```json
{
  "type": "init",
  "agents": {
    "george": {
      "name": "George",
      "type": "openclaw",
      "status": "online",
      "tasks": [...],
      "messages": [...]
    }
  }
}
```

#### New Message
```json
{
  "type": "message",
  "agent": "george",
  "message": {
    "role": "assistant",
    "content": "Response text",
    "ts": 1741435200000,
    "agent": "george"
  }
}
```

#### Status Update
```json
{
  "type": "status",
  "agent": "ryan",
  "status": "working",
  "task": "Processing your request..."
}
```

#### Stream Output
```json
{
  "type": "stream",
  "agent": "ryan",
  "chunk": "Partial output...",
  "error": false
}
```

---

## File Structure

```
apps/dashboard/
├── server-webhook.js       # Main backend (webhook-enabled)
├── server.js               # Old backend (deprecated)
├── package.json
├── package-lock.json
├── public/
│   └── index.html          # Frontend SPA
├── docs/
│   ├── user.md             # User documentation
│   ├── technical.md        # Technical docs
│   ├── issues.md           # Known issues
│   └── developer.md        # This file
├── Dockerfile              # Container build
├── docker-compose.yml      # Deployment config
└── DEPLOY.txt              # Deployment instructions
```

---

## Environment Variables

```bash
PORT=80                     # HTTP server port
WEBHOOK_URL=http://172.18.0.2:3001  # Webhook service URL
DASH_PASSWORD=Wayne2026#    # Login password
```

---

## Development Setup

### Local Development

1. **Install dependencies**:
   ```bash
   cd apps/dashboard
   npm install
   ```

2. **Set environment variables**:
   ```bash
   export PORT=3003
   export WEBHOOK_URL=http://172.18.0.2:3001
   export DASH_PASSWORD=Wayne2026#
   ```

3. **Run server**:
   ```bash
   node server-webhook.js
   ```

4. **Access dashboard**:
   ```
   http://localhost:3003
   ```

---

### Adding a New Agent

1. **Update `agentsState` in server-webhook.js**:
   ```javascript
   const agents = {
     // ... existing agents ...
     keisha: {
       name: 'Keisha',
       type: 'openclaw-subagent',
       status: 'idle',
       tasks: [],
       messages: [],
       sessionKey: null
     }
   };
   ```

2. **Create agent workspace**:
   ```bash
   mkdir -p /data/.openclaw/workspace/agents/keisha
   echo "# Keisha - AI Assistant" > /data/.openclaw/workspace/agents/keisha/memory.md
   ```

3. **Update webhook service** (`dashboard-webhook.js`):
   ```javascript
   const AGENT_WORKSPACES = {
     // ... existing workspaces ...
     keisha: '/data/.openclaw/workspace/agents/keisha'
   };
   ```

4. **Restart services**:
   ```bash
   # Restart webhook service
   pm2 restart dashboard-webhook
   
   # Restart dashboard
   docker-compose restart
   ```

---

### Adding a New Documentation Page

1. **Create markdown file**:
   ```bash
   echo "# API Reference" > apps/dashboard/docs/api.md
   ```

2. **Update `docs` array in index.html**:
   ```javascript
   const docs = [
     // ... existing docs ...
     { id: 'api', icon: '📡', title: 'API Reference', desc: 'REST API documentation' }
   ];
   ```

3. **Server will automatically serve it** at `/api/docs/api`

---

## Deployment

### Via Docker Compose

```bash
cd apps/dashboard
docker-compose up -d --build
```

### Via Systemd

1. **Create service file** (`/etc/systemd/system/dashboard.service`):
   ```ini
   [Unit]
   Description=OpenClaw Dashboard
   After=network.target

   [Service]
   Type=simple
   User=node
   WorkingDirectory=/opt/dashboard
   ExecStart=/usr/bin/node server-webhook.js
   Restart=on-failure
   Environment="PORT=80"
   Environment="WEBHOOK_URL=http://172.18.0.2:3001"
   Environment="DASH_PASSWORD=Wayne2026#"

   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable dashboard
   sudo systemctl start dashboard
   ```

---

## Testing

### Manual Test Script

```bash
#!/bin/bash
# Test dashboard functionality

echo "Testing auth endpoint..."
TOKEN=$(curl -s -X POST http://localhost/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"Wayne2026#"}' | jq -r '.token')

echo "Token: $TOKEN"

echo "Testing agents endpoint..."
curl -s http://localhost/api/agents \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "Testing docs endpoint..."
curl -s http://localhost/api/docs/user \
  -H "Authorization: Bearer $TOKEN" | head -20

echo "✓ Tests complete"
```

---

## Debugging

### Enable Verbose Logging

In `server-webhook.js`, add:

```javascript
const DEBUG = process.env.DEBUG === 'true';

function log(...args) {
  if (DEBUG) console.log('[Dashboard]', ...args);
}
```

Then run with:
```bash
DEBUG=true node server-webhook.js
```

### Inspect WebSocket Traffic

Use browser DevTools → Network → WS tab to see real-time WebSocket messages.

### Check Queue Status

```bash
watch -n 1 'ls -la /data/.openclaw/workspace/webhook-queue/'
```

---

## Security Considerations

### Password Storage

Currently using plain-text password comparison. For production:

```javascript
const bcrypt = require('bcrypt');

// Hash password
const hashedPassword = await bcrypt.hash('Wayne2026#', 10);

// Verify
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Session Tokens

Tokens are random 32-byte hex strings. Store in memory Map. For production, use Redis or database for persistence across restarts.

### Rate Limiting

Add rate limiting to prevent brute-force attacks:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});

app.post('/api/auth', loginLimiter, async (req, res) => {
  // ... auth logic
});
```

---

## Performance Optimization

### WebSocket Connection Pooling

Limit simultaneous WebSocket connections:

```javascript
let connectionCount = 0;
const MAX_CONNECTIONS = 100;

wss.on('connection', (ws) => {
  if (connectionCount >= MAX_CONNECTIONS) {
    ws.close(1008, 'Server at capacity');
    return;
  }
  connectionCount++;
  ws.on('close', () => connectionCount--);
});
```

### Message History Trimming

Automatically trim old messages to prevent memory bloat:

```javascript
function trimMessages(agent) {
  if (agent.messages.length > 1000) {
    agent.messages = agent.messages.slice(-500);
  }
}
```

---

## Contributing

### Code Style

- Use 2-space indentation
- Semicolons required
- Prefer `async/await` over callbacks
- Use descriptive variable names

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit PR with description

---

*Last updated: 2026-03-08 07:01 EDT*  
*Maintained by: George the 3rd*
