const express = require('express');
const crypto = require('crypto');
const http = require('http');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');

const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';
const authSessions = new Set();

const app = express();
const server = http.createServer(app);

// ─── WebSocket Server ───────────────────────────────────────────
const wss = new WebSocket.Server({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log('[WS] Client connected (' + wsClients.size + ' total)');
  
  // Send init with agent list
  ws.send(JSON.stringify({ type: 'init', agents: Object.keys(agentInfo) }));
  
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('[WS] Client disconnected (' + wsClients.size + ' total)');
  });
});

function wsBroadcast(data) {
  const msg = JSON.stringify(data);
  wsClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

app.use(express.json());

// No-cache headers for HTML to prevent stale JS
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// ─── Auth ───────────────────────────────────────────────────────
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === DASH_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    authSessions.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── Queue Webhook (inside OpenClaw container) ─────────────────
const QUEUE_WEBHOOK = 'http://172.18.0.2:3006';

console.log('[Dashboard] Server starting with SQLite + queue integration...');

axios.get(`${QUEUE_WEBHOOK}/health`)
  .then(res => console.log('[Dashboard] ✓ Queue Webhook:', res.data))
  .catch(err => console.log('[Dashboard] ⚠ Queue Webhook:', err.message));

// ─── SQLite Database ────────────────────────────────────────────
const Database = require('better-sqlite3');
const DB_PATH = path.join(__dirname, 'dashboard.db');
let db;

try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      task_description TEXT,
      model_used TEXT,
      status TEXT DEFAULT 'completed',
      tokens_used INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      source TEXT DEFAULT 'telegram',
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Work',
      priority TEXT NOT NULL DEFAULT 'Normal',
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'todo',
      track_status TEXT DEFAULT 'On Track',
      assigned_agent TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      status TEXT DEFAULT 'delivered',
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_logs(agent_name);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON agent_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    CREATE INDEX IF NOT EXISTS idx_chat_agent ON chat_messages(agent_name);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
  `);
  console.log('[Dashboard] ✓ SQLite database initialized at', DB_PATH);
} catch (err) {
  console.error('[Dashboard] ✗ SQLite error:', err.message);
}

// ─── Agent Definitions ──────────────────────────────────────────
const agentInfo = {
  george: { name: 'George', emoji: '👑', model: 'Opus 4.6', role: 'Main Orchestrator', color: '#0af' },
  scout:  { name: 'Scout',  emoji: '🔔', model: 'Haiku 4.5', role: 'Heartbeat Monitor', color: '#00ff88' },
  ryan:   { name: 'Ryan',   emoji: '🔧', model: 'Sonnet 4.5', role: 'Technical Specialist', color: '#3B82F6' },
  brian:  { name: 'Brian',  emoji: '📊', model: 'Sonnet 4.5', role: 'Research Analyst', color: '#7C3AED' },
  keisha: { name: 'Keisha', emoji: '✨', model: 'GPT-4.1', role: 'Creative Director', color: '#EC4899' }
};

// ─── API: Agents ────────────────────────────────────────────────
app.get('/api/agents', (req, res) => {
  const agents = {};
  const statsRows = db.prepare(`
    SELECT agent_name,
      COUNT(*) as total_tasks,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as tasks_today,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      MAX(created_at) as last_active,
      MAX(model_used) as last_model
    FROM agent_logs GROUP BY agent_name
  `).all();

  const statsMap = {};
  statsRows.forEach(r => { statsMap[r.agent_name] = r; });

  for (const [id, info] of Object.entries(agentInfo)) {
    const stats = statsMap[id] || {};
    const lastTask = db.prepare(
      'SELECT task_description, created_at FROM agent_logs WHERE agent_name = ? ORDER BY created_at DESC LIMIT 1'
    ).get(id);

    agents[id] = {
      id, ...info,
      status: id === 'george' ? 'online' : (stats.last_active ? 'idle' : 'offline'),
      total_tasks: stats.total_tasks || 0,
      tasks_today: stats.tasks_today || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      last_active: stats.last_active || null,
      last_model: stats.last_model || info.model,
      last_task: lastTask ? lastTask.task_description : null,
      last_task_time: lastTask ? lastTask.created_at : null
    };
  }
  res.json(agents);
});

// ─── API: Agent Logs ────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const agent = req.query.agent;
  
  let rows;
  if (agent) {
    rows = db.prepare('SELECT * FROM agent_logs WHERE agent_name = ? ORDER BY created_at DESC LIMIT ?').all(agent, limit);
  } else {
    rows = db.prepare('SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
  res.json(rows);
});

app.post('/api/logs', (req, res) => {
  const { agent_name, task_description, model_used, status, tokens_used, duration_ms, source } = req.body;
  if (!agent_name) return res.status(400).json({ error: 'agent_name required' });
  
  try {
    const result = db.prepare(`
      INSERT INTO agent_logs (agent_name, task_description, model_used, status, tokens_used, duration_ms, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(agent_name, task_description || '', model_used || '', status || 'completed', tokens_used || 0, duration_ms || 0, source || 'dashboard');
    
    console.log(`[Log] ${agent_name}: ${(task_description || '').substring(0, 60)}`);
    res.json({ id: result.lastInsertRowid, status: 'logged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Dashboard Stats ───────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM agent_logs WHERE date(created_at) = date('now')) as tasks_today,
      (SELECT COUNT(*) FROM agent_logs WHERE created_at >= datetime('now', '-7 days')) as tasks_week,
      (SELECT COUNT(*) FROM agent_logs) as tasks_total,
      (SELECT ROUND(100.0 * SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) FROM agent_logs) as success_rate,
      (SELECT agent_name FROM agent_logs GROUP BY agent_name ORDER BY COUNT(*) DESC LIMIT 1) as most_active
  `).get();
  res.json(stats);
});

// ─── API: Todos (Kanban) ────────────────────────────────────────
app.get('/api/todos', (req, res) => {
  const rows = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/todos', (req, res) => {
  const { title, category, priority, due_date, status, track_status, assigned_agent } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  
  try {
    const result = db.prepare(`
      INSERT INTO todos (title, category, priority, due_date, status, track_status, assigned_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, category || 'Work', priority || 'Normal', due_date || null, status || 'todo', track_status || 'On Track', assigned_agent || null);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, category, priority, due_date, status, track_status, assigned_agent } = req.body;
  
  try {
    if (status && Object.keys(req.body).length === 1) {
      // Quick status update (drag & drop)
      db.prepare("UPDATE todos SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    } else {
      db.prepare(`
        UPDATE todos SET title=?, category=?, priority=?, due_date=?, status=?, track_status=?, assigned_agent=?, updated_at=datetime('now')
        WHERE id=?
      `).run(title, category, priority, due_date, status, track_status, assigned_agent, id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── API: Chat Messages ─────────────────────────────────────────
app.get('/api/chat/:agentId', (req, res) => {
  const { agentId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const rows = db.prepare('SELECT * FROM chat_messages WHERE agent_name = ? ORDER BY created_at ASC LIMIT ?').all(agentId, limit);
  res.json(rows);
});

app.post('/api/chat/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;
  if (!agentInfo[agentId]) return res.status(404).json({ error: 'Agent not found' });
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Save user message to DB
  const userMsg = db.prepare(
    "INSERT INTO chat_messages (agent_name, role, content) VALUES (?, 'user', ?)"
  ).run(agentId, message);
  
  // Broadcast user message via WebSocket
  wsBroadcast({ type: 'chat', agent: agentId, role: 'user', content: message, id: userMsg.lastInsertRowid });
  
  // Send typing indicator
  wsBroadcast({ type: 'typing', agent: agentId, typing: true });

  try {
    // Send to queue webhook for processing
    const response = await axios.post(`${QUEUE_WEBHOOK}/agent/${agentId}`, { message }, { timeout: 5000 });
    const requestId = response.data.requestId;
    
    res.json({ status: 'sent', requestId, messageId: userMsg.lastInsertRowid });
    
    // Poll for response (up to 2 minutes)
    let attempts = 0;
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const statusResp = await axios.get(`${QUEUE_WEBHOOK}/status/${requestId}`, { timeout: 3000 });
        if (statusResp.data.status === 'completed' && statusResp.data.response) {
          clearInterval(pollInterval);
          
          // Save assistant response to DB
          const assistantMsg = db.prepare(
            "INSERT INTO chat_messages (agent_name, role, content) VALUES (?, 'assistant', ?)"
          ).run(agentId, statusResp.data.response);
          
          // Broadcast response via WebSocket
          wsBroadcast({ type: 'chat', agent: agentId, role: 'assistant', content: statusResp.data.response, id: assistantMsg.lastInsertRowid });
          wsBroadcast({ type: 'typing', agent: agentId, typing: false });
          
          // Log activity
          db.prepare(
            "INSERT INTO agent_logs (agent_name, task_description, model_used, status, source) VALUES (?, ?, ?, 'completed', 'dashboard')"
          ).run(agentId, message.substring(0, 200), agentInfo[agentId].model);
          
          console.log(`[Chat] ${agentId} responded to: ${message.substring(0, 60)}`);
        }
      } catch (e) {}
      
      if (attempts > 60) { // 2 min timeout
        clearInterval(pollInterval);
        wsBroadcast({ type: 'typing', agent: agentId, typing: false });
        wsBroadcast({ type: 'chat', agent: agentId, role: 'assistant', content: '⚠️ Response timed out. The agent may still be processing.' });
      }
    }, 2000);
    
  } catch (error) {
    wsBroadcast({ type: 'typing', agent: agentId, typing: false });
    res.status(500).json({ error: 'Failed to send: ' + error.message });
  }
});

app.delete('/api/chat/:agentId', (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE agent_name = ?').run(req.params.agentId);
  res.json({ ok: true });
});

// ─── API: Agent Message (Queue - legacy) ────────────────────────
app.post('/api/agents/:id/message', async (req, res) => {
  const agentId = req.params.id;
  const { message } = req.body;
  if (!agentInfo[agentId]) return res.status(404).json({ error: 'Agent not found' });
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    const response = await axios.post(`${QUEUE_WEBHOOK}/agent/${agentId}`, { message }, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send: ' + error.message });
  }
});

app.get('/api/status/:requestId', async (req, res) => {
  try {
    const response = await axios.get(`${QUEUE_WEBHOOK}/status/${req.params.requestId}`, { timeout: 3000 });
    res.json(response.data);
  } catch (error) {
    res.json({ status: 'pending' });
  }
});

// ─── API: Text-to-Speech (ElevenLabs) ───────────────────────────
const ELEVEN_API_KEY = '57c09b8f5eeffb886a2e2635025c18188247c20228f3018cfb314c7b8198ac66';
const ELEVEN_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  
  // Clean markdown for speech
  const cleanText = text.replace(/\*\*/g, '').replace(/[#*_`]/g, '').replace(/\n+/g, '. ').replace(/\[.*?\]/g, '').substring(0, 1000);
  
  try {
    const ttsResp = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      data: {
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      },
      responseType: 'arraybuffer',
      timeout: 15000
    });
    
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-cache');
    res.send(Buffer.from(ttsResp.data));
  } catch (err) {
    console.error('[TTS] ElevenLabs error:', err.message);
    res.status(500).json({ error: 'TTS failed: ' + err.message });
  }
});

// ─── Health ─────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let queueStatus = 'disconnected';
  try {
    const r = await axios.get(`${QUEUE_WEBHOOK}/health`, { timeout: 2000 });
    queueStatus = r.data;
  } catch (e) {}
  
  res.json({
    status: 'ok',
    queue: queueStatus,
    db: db ? 'connected' : 'disconnected',
    agents: Object.keys(agentInfo).length,
    uptime: process.uptime()
  });
});

// ─── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 80;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dashboard] ✓ Running on port ${PORT}`);
  console.log(`[Dashboard] ✓ SQLite: ${DB_PATH}`);
  console.log(`[Dashboard] ✓ Queue: ${QUEUE_WEBHOOK}`);
  console.log(`[Dashboard] ✓ Agents: ${Object.keys(agentInfo).join(', ')}`);
});
