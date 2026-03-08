const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 80;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';
const GEORGE_SESSION = process.env.GEORGE_SESSION || 'agent:main:main';

// ── State ──
const agents = {
  george: { name: 'George', type: 'openclaw', status: 'online', tasks: [], messages: [], lastHistorySize: 0 },
  ryan: { name: 'Ryan', type: 'claude-code', status: 'idle', tasks: [], messages: [], process: null }
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

// ── George (OpenClaw) via sessions_send/sessions_history ──
async function sendToGeorge(message) {
  try {
    // Use docker exec to call openclaw from the host
    const cmd = `docker exec openclaw-main openclaw sessions send --session "${GEORGE_SESSION}" --message "${message.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await execAsync(cmd);
    console.log('[George] Message sent:', stdout);
    return true;
  } catch (e) {
    console.error('[George] Send failed:', e.message);
    return false;
  }
}

async function pollGeorgeHistory() {
  try {
    const cmd = `docker exec openclaw-main openclaw sessions history --session "${GEORGE_SESSION}" --limit 50 --format json`;
    const { stdout } = await execAsync(cmd);
    const history = JSON.parse(stdout);
    
    // Only process new messages since last poll
    if (history.length > agents.george.lastHistorySize) {
      const newMessages = history.slice(agents.george.lastHistorySize);
      for (const msg of newMessages) {
        // Only add assistant messages (George's replies)
        if (msg.role === 'assistant') {
          const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          const newMsg = { role: 'assistant', content, ts: Date.now(), agent: 'george' };
          agents.george.messages.push(newMsg);
          broadcast({ type: 'message', agent: 'george', message: newMsg });
        }
      }
      agents.george.lastHistorySize = history.length;
    }
  } catch (e) {
    console.error('[George] History poll failed:', e.message);
  }
}

// Poll George's session history every 5 seconds
setInterval(pollGeorgeHistory, 5000);

// ── Ryan (Claude Code) ──
function sendToRyan(task, ws) {
  if (agents.ryan.process) {
    agents.ryan.process.kill();
  }
  
  agents.ryan.status = 'working';
  agents.ryan.tasks.push({ task, startedAt: Date.now() });
  broadcast({ type: 'status', agent: 'ryan', status: 'working', task });

  const proc = spawn('claude', ['--print', task], {
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

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      
      if (data.type === 'chat' && data.agent === 'george') {
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: 'george' };
        agents.george.messages.push(msg);
        broadcast({ type: 'message', agent: 'george', message: msg });
        await sendToGeorge(data.message);
        // Poll immediately for response
        setTimeout(pollGeorgeHistory, 1000);
      }
      
      if (data.type === 'chat' && data.agent === 'ryan') {
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: 'ryan' };
        agents.ryan.messages.push(msg);
        broadcast({ type: 'message', agent: 'ryan', message: msg });
        sendToRyan(data.message, ws);
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
      lastActive: v.messages.length ? v.messages[v.messages.length - 1].ts : null
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
  console.log(`George session: ${GEORGE_SESSION}`);
  // Initial history load
  pollGeorgeHistory();
});
