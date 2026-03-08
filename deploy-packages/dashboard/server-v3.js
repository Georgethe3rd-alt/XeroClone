const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

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
    messages: [{ role: 'assistant', content: 'Chat with George via Telegram. Use this dashboard for Ryan.', ts: Date.now(), agent: 'george' }],
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

// Load briefing
const briefingPath = '/app/briefing.md';
let briefing = '';
try {
  if (fs.existsSync(briefingPath)) {
    briefing = fs.readFileSync(briefingPath, 'utf-8');
  }
} catch(e) {}

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
function sendToRyan(task) {
  agents.ryan.status = 'working';
  agents.ryan.tasks.push({ task, startedAt: Date.now() });
  broadcast({ type: 'status', agent: 'ryan', status: 'working', task });

  console.log('[Ryan] Executing claude for task:', task.substring(0, 100));

  // Use wrapper script with API key in env
  const escapedTask = task.replace(/'/g, "'\\''");
  const cmd = `/app/ryan.sh '${escapedTask}'`;
  
  exec(cmd, {
    env: { ...process.env, ANTHROPIC_API_KEY },
    cwd: '/app',
    timeout: 300000,
    maxBuffer: 10 * 1024 * 1024
  }, (error, stdout, stderr) => {
    agents.ryan.status = 'idle';
    
    if (error && error.killed) {
      console.error('[Ryan] Process timeout/killed');
      const msg = { role: 'assistant', content: `Error: Process timeout or killed`, ts: Date.now(), agent: 'ryan' };
      agents.ryan.messages.push(msg);
      broadcast({ type: 'message', agent: 'ryan', message: msg });
      broadcast({ type: 'status', agent: 'ryan', status: 'idle' });
      return;
    }

    const output = stdout || stderr || (error ? `Error: ${error.message}` : '[No output]');
    console.log('[Ryan] Output length:', output.length);
    
    const msg = { role: 'assistant', content: output.trim(), ts: Date.now(), agent: 'ryan' };
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
  console.log('[WS] Client connected');
  
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
      console.log('[WS] Received:', data);
      
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

app.get('/api/briefing', authCheck, (req, res) => {
  res.type('text/markdown').send(briefing || 'No briefing available');
});

// ── Start ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
  console.log('George: Telegram (read-only)');
  console.log('Ryan: Claude Code (interactive)');
  console.log('Briefing:', briefing ? `${briefing.length} chars loaded` : 'not found');
});
