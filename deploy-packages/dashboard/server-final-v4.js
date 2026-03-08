const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 80;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DASH_PASSWORD = process.env.DASH_PASSWORD || 'Wayne2026#';

const QUEUE_DIR = '/tmp/ryan-queue';
const RESULTS_DIR = '/tmp/ryan-results';
[QUEUE_DIR, RESULTS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

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
    readOnly: false
  }
};

const briefingPath = '/app/briefing.md';
let briefing = '';
try {
  if (fs.existsSync(briefingPath)) briefing = fs.readFileSync(briefingPath, 'utf-8');
} catch(e) {}

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

// ── Ryan (File-based queue) ──
function sendToRyan(task) {
  const jobId = Date.now() + '-' + Math.random().toString(36).substring(7);
  const jobFile = path.join(QUEUE_DIR, jobId + '.json');
  
  agents.ryan.status = 'working';
  agents.ryan.tasks.push({ task, startedAt: Date.now(), jobId });
  broadcast({ type: 'status', agent: 'ryan', status: 'working', task });

  console.log('[Ryan] Queuing job:', jobId, task.substring(0, 50));
  
  fs.writeFileSync(jobFile, JSON.stringify({ task, jobId, created: Date.now() }));
  
  // Poll for result
  const resultFile = path.join(RESULTS_DIR, jobId + '.txt');
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    pollCount++;
    if (fs.existsSync(resultFile)) {
      clearInterval(pollInterval);
      const output = fs.readFileSync(resultFile, 'utf-8');
      fs.unlinkSync(resultFile);
      
      console.log('[Ryan] Job completed:', jobId, output.length, 'chars');
      
      agents.ryan.status = 'idle';
      const msg = { role: 'assistant', content: output.trim() || '[No output]', ts: Date.now(), agent: 'ryan' };
      agents.ryan.messages.push(msg);
      broadcast({ type: 'message', agent: 'ryan', message: msg });
      broadcast({ type: 'status', agent: 'ryan', status: 'idle' });
    } else if (pollCount > 60) {
      clearInterval(pollInterval);
      console.error('[Ryan] Job timeout:', jobId);
      agents.ryan.status = 'idle';
      const msg = { role: 'assistant', content: '[Timeout - no response after 60s]', ts: Date.now(), agent: 'ryan' };
      agents.ryan.messages.push(msg);
      broadcast({ type: 'message', agent: 'ryan', message: msg });
      broadcast({ type: 'status', agent: 'ryan', status: 'idle' });
    }
  }, 1000);
}

// Worker process (runs in background)
function startWorker() {
  setInterval(() => {
    try {
    const jobs = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'));
    if (jobs.length === 0) return;
    
    const jobFile = path.join(QUEUE_DIR, jobs[0]);
    let job;
    try {
      job = JSON.parse(fs.readFileSync(jobFile, 'utf-8'));
    } catch(e) {
      console.error('[Worker] Bad JSON in', jobs[0], '- deleting');
      fs.unlinkSync(jobFile);
      return;
    }
    fs.unlinkSync(jobFile);
    
    console.log('[Worker] Processing job:', job.jobId);
    
    // Write task to file
    const taskFile = `/tmp/task-${job.jobId}.txt`;
    const resultFile = path.join(RESULTS_DIR, job.jobId + '.txt');
    fs.writeFileSync(taskFile, job.task);
    
    // Execute via execSync (spawn hangs in this container)
    try {
      execSync(`/app/claude-exec.sh "${taskFile}" "${resultFile}"`, {
        env: { ...process.env, ANTHROPIC_API_KEY },
        cwd: '/app',
        timeout: 60000,
        stdio: 'pipe'
      });
      
      if (fs.existsSync(resultFile)) {
        console.log('[Worker] Result file created:', fs.statSync(resultFile).size, 'bytes');
      }
    } catch(execErr) {
      console.error('[Worker] Exec error:', execErr.message?.substring(0, 100));
      if (!fs.existsSync(resultFile)) {
        fs.writeFileSync(resultFile, '[Error: ' + (execErr.message || 'unknown') + ']');
      }
    }
    
    try { fs.unlinkSync(taskFile); } catch(e) {}
    console.log('[Worker] Job done:', job.jobId);
    } catch(outerErr) {
      console.error('[Worker] Unhandled error:', outerErr.message);
    }
  }, 500);
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
        name: v.name, type: v.type, status: v.status,
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
  console.log('George: Telegram (read-only)');
  console.log('Ryan: Claude Code (file-queue worker)');
  startWorker();
});
