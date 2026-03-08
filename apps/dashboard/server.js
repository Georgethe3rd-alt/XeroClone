const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const { marked } = require('marked');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 80;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://172.18.0.2:3001';
const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';

// ── State ──
const agents = {
  george: { name: 'George', type: 'openclaw', status: 'online', tasks: [], messages: [], sessionKey: null },
  ryan: { name: 'Ryan', type: 'openclaw-subagent', status: 'idle', tasks: [], messages: [], sessionKey: null },
  brian: { name: 'Brian', type: 'openclaw-subagent', status: 'idle', tasks: [], messages: [], sessionKey: null }
};

// ── Auth middleware ──
const sessions = new Set();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === DASH_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

function authCheck(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Webhook Integration ──

/**
 * Spawn an agent via webhook
 */
async function spawnAgent(agentId) {
  try {
    const response = await axios.post(`${WEBHOOK_URL}/webhook/agent/spawn`, {
      agentId,
      type: 'persistent',
      model: 'anthropic/claude-sonnet-4-5',
      callbackUrl: `http://187.77.217.138:${PORT}/webhook/agent-callback`
    });
    
    if (response.data.sessionKey) {
      agents[agentId].sessionKey = response.data.sessionKey;
      agents[agentId].status = 'online';
      broadcast({ type: 'status', agent: agentId, status: 'online' });
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to spawn ${agentId}:`, error.message);
    agents[agentId].status = 'error';
    broadcast({ type: 'status', agent: agentId, status: 'error', error: error.message });
    return { error: error.message };
  }
}

/**
 * Send message to agent via webhook
 */
async function sendToAgent(agentId, message) {
  try {
    // Ensure agent is spawned
    if (!agents[agentId].sessionKey) {
      await spawnAgent(agentId);
    }
    
    agents[agentId].status = 'working';
    agents[agentId].tasks.push({ task: message, startedAt: Date.now() });
    broadcast({ type: 'status', agent: agentId, status: 'working', task: message });
    
    const response = await axios.post(`${WEBHOOK_URL}/webhook/agent/message`, {
      agentId,
      sessionKey: agents[agentId].sessionKey,
      message,
      callbackUrl: `http://187.77.217.138:${PORT}/webhook/agent-callback`
    });
    
    return response.data;
  } catch (error) {
    console.error(`Failed to send message to ${agentId}:`, error.message);
    agents[agentId].status = 'error';
    broadcast({ type: 'status', agent: agentId, status: 'error', error: error.message });
    return { error: error.message };
  }
}

/**
 * Webhook callback endpoint - receives agent responses
 */
app.post('/webhook/agent-callback', (req, res) => {
  const { type, agentId, message, sessionKey, status } = req.body;
  
  console.log(`[Callback] ${type} from ${agentId}:`, message ? message.substring(0, 50) : status);
  
  if (type === 'spawn_complete') {
    agents[agentId].sessionKey = sessionKey;
    agents[agentId].status = status || 'online';
    broadcast({ type: 'status', agent: agentId, status: status || 'online' });
  }
  
  if (type === 'agent_response') {
    agents[agentId].status = 'idle';
    const msg = { role: 'assistant', content: message, ts: Date.now(), agent: agentId };
    agents[agentId].messages.push(msg);
    broadcast({ type: 'message', agent: agentId, message: msg });
    broadcast({ type: 'status', agent: agentId, status: 'idle' });
  }
  
  res.json({ received: true });
});

// ── WebSocket ──
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    agents: Object.fromEntries(
      Object.entries(agents).map(([k, v]) => [k, {
        name: v.name, type: v.type, status: v.status,
        tasks: v.tasks.slice(-5),
        messages: v.messages.slice(-50)
      }])
    )
  }));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      
      if (data.type === 'chat') {
        const agentId = data.agent;
        if (!agents[agentId]) return;
        
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: agentId };
        agents[agentId].messages.push(msg);
        broadcast({ type: 'message', agent: agentId, message: msg });
        
        sendToAgent(agentId, data.message);
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });
});

// ── API routes ──
app.get('/api/agents', authCheck, (req, res) => {
  res.json(Object.fromEntries(
    Object.entries(agents).map(([k, v]) => [k, {
      name: v.name, type: v.type, status: v.status,
      taskCount: v.tasks.length,
      messageCount: v.messages.length,
      lastActive: v.messages.length ? v.messages[v.messages.length - 1].ts : null
    }])
  ));
});

app.get('/api/agents/:id/messages', authCheck, (req, res) => {
  const agent = agents[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent.messages.slice(-100));
});

app.post('/api/agents/:id/spawn', authCheck, async (req, res) => {
  const agentId = req.params.id;
  if (!agents[agentId]) return res.status(404).json({ error: 'Agent not found' });
  
  const result = await spawnAgent(agentId);
  res.json(result);
});

app.get('/api/docs/:id', authCheck, (req, res) => {
  const docId = req.params.id;
  const docPath = path.join(__dirname, 'docs', `${docId}.md`);
  
  if (!fs.existsSync(docPath)) {
    return res.status(404).send('<h1>Documentation not found</h1>');
  }
  
  try {
    const markdown = fs.readFileSync(docPath, 'utf8');
    const html = marked(markdown);
    res.send(html);
  } catch (error) {
    res.status(500).send('<h1>Error loading documentation</h1>');
  }
});

// ── Start ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
  console.log(`Webhook integration: ${WEBHOOK_URL}`);
  console.log(`Callback endpoint: http://187.77.217.138:${PORT}/webhook/agent-callback`);
});
