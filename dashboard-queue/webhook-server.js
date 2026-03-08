// Queue Webhook Server - Auto-processing via openclaw agent CLI
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3006;
const REQUESTS_DIR = path.join(__dirname, 'requests');
const RESPONSES_DIR = path.join(__dirname, 'responses');
const PROCESSING_DIR = path.join(__dirname, 'processing');

[REQUESTS_DIR, RESPONSES_DIR, PROCESSING_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Agent model mapping
const agentModels = {
  george: 'main',
  scout: 'scout',
  ryan: 'ryan',
  brian: 'brian',
  keisha: 'keisha'
};

// Track active requests
const activeRequests = new Map();

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'queue-webhook', active: activeRequests.size }));
    return;
  }

  // POST /agent/:agentId — send message to agent
  const agentMatch = req.url.match(/^\/agent\/(\w+)$/);
  if (agentMatch && req.method === 'POST') {
    const agentId = agentMatch[1];
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        const requestId = `${agentId}-${Date.now()}`;
        
        // Save request file
        fs.writeFileSync(path.join(REQUESTS_DIR, `${requestId}.json`), JSON.stringify({
          agentId, message, requestId, timestamp: new Date().toISOString()
        }));

        // Auto-process: spawn openclaw agent CLI
        processRequest(agentId, message, requestId);

        res.writeHead(200);
        res.end(JSON.stringify({ status: 'queued', requestId, agentId }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /status/:requestId — check response
  const statusMatch = req.url.match(/^\/status\/(.+)$/);
  if (statusMatch && req.method === 'GET') {
    const requestId = statusMatch[1];
    
    // Check if still processing
    if (activeRequests.has(requestId)) {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'processing', requestId }));
      return;
    }
    
    // Check for response file
    const responsePath = path.join(RESPONSES_DIR, `${requestId}.json`);
    if (fs.existsSync(responsePath)) {
      const data = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'completed', ...data }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ status: 'pending', requestId }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not found' }));
});

// Auto-process requests via openclaw agent CLI
function processRequest(agentId, message, requestId) {
  activeRequests.set(requestId, { agentId, startedAt: Date.now() });
  
  // Map agent IDs to openclaw agent IDs
  const openclawAgent = agentModels[agentId] || agentId;
  
  // Escape message for shell
  const escapedMsg = message.replace(/'/g, "'\\''");
  
  const cmd = `openclaw agent --agent ${openclawAgent} --message '${escapedMsg}' --json --timeout 120 2>&1`;
  
  console.log(`[Process] ${agentId}: ${message.substring(0, 60)}...`);
  
  exec(cmd, { timeout: 130000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    activeRequests.delete(requestId);
    
    let response = '';
    let model = '';
    let durationMs = 0;
    
    try {
      // Parse JSON output from openclaw agent
      const result = JSON.parse(stdout);
      
      if (result.status === 'ok' && result.result && result.result.payloads) {
        response = result.result.payloads.map(p => p.text).filter(Boolean).join('\n\n');
        model = result.result.meta?.agentMeta?.model || '';
        durationMs = result.result.meta?.durationMs || 0;
      } else if (result.error) {
        response = '⚠️ Agent error: ' + result.error;
      } else {
        response = stdout.trim() || '⚠️ No response from agent';
      }
    } catch (e) {
      // Not JSON - try raw text
      response = stdout.trim() || stderr.trim() || '⚠️ Agent failed to respond';
    }
    
    if (error && !response) {
      response = '⚠️ Agent timed out or failed';
    }
    
    // Save response
    const responseData = { requestId, agentId, response, model, durationMs, timestamp: new Date().toISOString() };
    fs.writeFileSync(path.join(RESPONSES_DIR, `${requestId}.json`), JSON.stringify(responseData));
    
    // Move request to processing (archive)
    const reqPath = path.join(REQUESTS_DIR, `${requestId}.json`);
    if (fs.existsSync(reqPath)) {
      fs.renameSync(reqPath, path.join(PROCESSING_DIR, `${requestId}.json`));
    }
    
    console.log(`[Done] ${agentId} (${durationMs}ms): ${response.substring(0, 80)}`);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Queue Webhook] Running on port ${PORT}`);
  console.log(`[Queue Webhook] Auto-processing enabled via openclaw agent CLI`);
  console.log(`[Queue Webhook] Dirs: requests/ responses/ processing/`);
});
