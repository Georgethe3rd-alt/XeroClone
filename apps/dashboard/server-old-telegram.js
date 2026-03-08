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
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8505098201:AAHYStcNvBwrBklSDkdO0O6OY32eNm-STSk';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8383924559';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';

// ── State ──
const agents = {
  george: { name: 'George', type: 'openclaw', status: 'online', tasks: [], messages: [] },
  ryan: { name: 'Ryan', type: 'claude-code', status: 'idle', tasks: [], messages: [], process: null }
};

let lastTelegramUpdateId = 0;
let georgePolling = null;

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

// ── Telegram helpers (for George) ──
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
  });
  return resp.json();
}

async function getTelegramUpdates() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastTelegramUpdateId + 1}&timeout=5&allowed_updates=["message"]`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await resp.json();
    if (data.ok && data.result?.length) {
      for (const update of data.result) {
        lastTelegramUpdateId = update.update_id;
        // Only capture bot's own messages (George's replies) sent TO Wayne
        // We look for messages from the bot itself
        if (update.message?.from?.is_bot && update.message?.chat?.id == TELEGRAM_CHAT_ID) {
          const msg = { role: 'assistant', content: update.message.text || '[media]', ts: Date.now(), agent: 'george' };
          agents.george.messages.push(msg);
          broadcast({ type: 'message', agent: 'george', message: msg });
        }
      }
    }
  } catch (e) { /* timeout or network error, ignore */ }
}

function startGeorgePolling() {
  if (georgePolling) return;
  georgePolling = setInterval(getTelegramUpdates, 6000);
}

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
    cwd: '/data/.openclaw/workspace',
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

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      
      if (data.type === 'chat' && data.agent === 'george') {
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: 'george' };
        agents.george.messages.push(msg);
        broadcast({ type: 'message', agent: 'george', message: msg });
        sendTelegram(data.message);
      }
      
      if (data.type === 'chat' && data.agent === 'ryan') {
        const msg = { role: 'user', content: data.message, ts: Date.now(), agent: 'ryan' };
        agents.ryan.messages.push(msg);
        broadcast({ type: 'message', agent: 'ryan', message: msg });
        sendToRyan(data.message, ws);
      }
    } catch (e) {}
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
  startGeorgePolling();
});
