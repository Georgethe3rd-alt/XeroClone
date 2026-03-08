const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 80;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';

// ── State ──
const agents = {
  george: { 
    name: 'George', 
    type: 'openclaw', 
    status: 'online', 
    tasks: [{ task: 'Monitoring via Telegram', startedAt: Date.now() }], 
    messages: [{ role: 'assistant', content: 'George is available via Telegram. Use this dashboard to chat with Ryan.', ts: Date.now(), agent: 'george' }],
    readOnly: true
  },
  ryan: { 
    name: 'Ryan', 
    type: 'claude-code', 
    status: 'idle', 
    tasks: [], 
    messages: [], 
    process: null,
    readOnly: false
  }
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

// ── Ryan (Claude Code) ──
const fs = require('fs');
const briefingPath = '/app/briefing.md';
let ryanBriefing = '';
if (fs.existsSync(briefingPath)) {
  ryanBriefing = fs.readFileSync(briefingPath, 'utf-8');
}

function sendToRyan(task) {
  if (agents.ryan.process) {
    agents.ryan.process.kill();
  }
  
  agents.ryan.status = 'working';
  agents.ryan.tasks.push({ task, startedAt: Date.now() });
  broadcast({ type: 'status', agent: 'ryan', status: 'working', task });

  // Only include briefing when explicitly requested
  const needsBriefing = task.toLowerCase().includes('briefing') || 
                        task.toLowerCase().includes('show me your context') ||
                        task.toLowerCase().includes('what do you know');

  const fullTask = needsBriefing && ryanBriefing
    ? `Context available at /app/briefing.md:\n\n${ryanBriefing.substring(0, 2000)}...\n\n---\n\nTask: ${task}` 
    : task;

  const proc = spawn('claude', ['--print', fullTask], {
    env: { ...process.env, ANTHROPIC_API_KEY },
    cwd: '/app',
    timeout: 300000
  });

  agents.ryan.process = proc;
  let output = '';

  proc.stdout.on('data', (chunk) => {
    output += chunk.toString();
    broadcast({ type: 'stream', agent: 'ryan', chunk: chunk.toString() });
  });

  proc.stderr.on('data', (chunk) => {
    broadcast({ type: 'stream', agent: 'ryan', chunk: chunk.toString(), error: true });
  });

  proc.on('close', (code) => {
    agents.ryan.status = 'idle';
    agents.ryan.process = null;
    const msg = { role: 'assistant', content: output.trim() || '[No output]', ts: Date.now(), agent: 'ryan' };
    agents.ryan.messages.push(msg);
    broadcast({ type: 'message', agent: 'ryan', message: msg });
    broadcast({ type: 'status', agent: 'ryan', status: 'idle' });
  });
}

// ── WebSocket ──
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'init',
    agents: Object.fromEntries(
      Object.entries(agents).map(([k, v]) => [k, {
        name: v.name, 
        type: v.type, 
        status: v.status,
        tasks: v.tasks.slice(-5),
        messages: v.messages.slice(-50),
        readOnly: v.readOnly || false
      }])
    )
  }));

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      
      if (data.type === 'chat' && data.agent === 'ryan') {
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: 'ryan' };
        agents.ryan.messages.push(msg);
        broadcast({ type: 'message', agent: 'ryan', message: msg });
        sendToRyan(data.message);
      }
    } catch (e) {
      console.error('[WS] Error:', e.message);
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
      lastActive: v.messages.length ? v.messages[v.messages.length - 1].ts : null,
      readOnly: v.readOnly || false
    }])
  ));
});

app.get('/api/agents/:id/messages', authCheck, (req, res) => {
  const agent = agents[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent.messages.slice(-100));
});

// ── Start ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
  console.log('George: Telegram (read-only monitor)');
  console.log('Ryan: Claude Code (full chat)');
});
