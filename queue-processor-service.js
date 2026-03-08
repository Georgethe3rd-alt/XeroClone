#!/usr/bin/env node
/**
 * Queue Processor Service
 * 
 * Persistent service that polls webhook queue and processes requests
 * Uses OpenClaw tools (sessions_spawn, sessions_send) via exec
 * Runs continuously with configurable poll interval
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';
const SESSION_STORE = '/data/.openclaw/workspace/agent-sessions.json';
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;

// Ensure directories exist
[QUEUE_DIR, RESPONSES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Session tracking
let sessions = {};
if (fs.existsSync(SESSION_STORE)) {
  try {
    sessions = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
  } catch (err) {
    console.error('[Processor] Error loading sessions:', err.message);
  }
}

function saveSessions() {
  fs.writeFileSync(SESSION_STORE, JSON.stringify(sessions, null, 2));
}

/**
 * Spawn an agent using sessions_spawn tool via OpenClaw CLI
 */
async function spawnAgent(request) {
  const { agentId, type, model, workspace, memory } = request;
  
  console.log(`[Processor] Spawning ${agentId} (${type}, ${model})...`);
  
  // Check if already spawned
  if (sessions[agentId]) {
    console.log(`[Processor] ${agentId} already spawned: ${sessions[agentId]}`);
    return {
      success: true,
      sessionKey: sessions[agentId],
      cached: true
    };
  }
  
  // Build spawn command
  const runtime = (type === 'claude-code' || type === 'coding-agent') ? 'acp' : 'subagent';
  const agentIdFlag = type === 'claude-code' ? '--agentId claude-code' : '';
  
  const cmd = `openclaw agent run ${agentIdFlag} \
    --model ${model} \
    --message "You are ${agentId}. Initialize and read your memory at ${memory}." \
    2>&1`;
  
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });
    
    // For now, generate a session key
    // TODO: Parse actual session key from openclaw output
    const sessionKey = `agent:${agentId}:${Date.now()}`;
    sessions[agentId] = sessionKey;
    saveSessions();
    
    console.log(`[Processor] ${agentId} spawned successfully: ${sessionKey}`);
    
    return {
      success: true,
      sessionKey,
      output: stdout.substring(0, 200)
    };
    
  } catch (err) {
    console.error(`[Processor] Spawn failed for ${agentId}:`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Send message to agent
 */
async function sendMessage(request) {
  const { agentId, sessionKey, message } = request;
  
  console.log(`[Processor] Sending to ${agentId}: "${message.substring(0, 50)}..."`);
  
  // For now, use openclaw agent run to send message
  const cmd = `openclaw agent run \
    --message "${message.replace(/"/g, '\\"')}" \
    2>&1`;
  
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    
    console.log(`[Processor] ${agentId} responded`);
    
    return {
      success: true,
      response: stdout.trim()
    };
    
  } catch (err) {
    console.error(`[Processor] Message failed for ${agentId}:`, err.message);
    return {
      success: false,
      error: err.message,
      response: `Error communicating with ${agentId}: ${err.message}`
    };
  }
}

/**
 * Process a single request file
 */
async function processRequest(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const request = JSON.parse(content);
    
    console.log(`[Processor] Processing ${fileName}: ${request.action} for ${request.agentId}`);
    
    let result;
    if (request.action === 'spawn') {
      result = await spawnAgent(request);
    } else if (request.action === 'message') {
      result = await sendMessage(request);
    } else {
      throw new Error(`Unknown action: ${request.action}`);
    }
    
    // Send callback if provided
    if (request.callbackUrl) {
      try {
        const callbackData = {
          type: request.action === 'spawn' ? 'spawn_complete' : 'agent_response',
          agentId: request.agentId,
          ...(request.action === 'spawn' ? {
            sessionKey: result.sessionKey,
            status: result.success ? 'online' : 'error'
          } : {
            message: result.response || result.error
          })
        };
        
        await axios.post(request.callbackUrl, callbackData, { timeout: 5000 });
        console.log(`[Processor] Callback sent for ${request.agentId}`);
      } catch (err) {
        console.error(`[Processor] Callback failed:`, err.message);
      }
    }
    
    // Write response file
    const responseFile = path.join(RESPONSES_DIR, fileName);
    fs.writeFileSync(responseFile, JSON.stringify(result, null, 2));
    
    // Remove from queue
    fs.unlinkSync(filePath);
    
    console.log(`[Processor] ✓ ${fileName} processed successfully`);
    
  } catch (err) {
    console.error(`[Processor] Error processing ${fileName}:`, err.message);
    
    // Move to error directory if max retries exceeded
    const errorDir = path.join(QUEUE_DIR, 'errors');
    if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir);
    fs.renameSync(filePath, path.join(errorDir, fileName));
  }
}

/**
 * Process all files in queue
 */
async function processQueue() {
  try {
    const files = fs.readdirSync(QUEUE_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(QUEUE_DIR, f))
      .sort(); // Process in order
    
    if (files.length === 0) {
      return; // No work to do
    }
    
    console.log(`[Processor] Found ${files.length} request(s) in queue`);
    
    for (const file of files) {
      await processRequest(file);
    }
    
  } catch (err) {
    console.error(`[Processor] Queue processing error:`, err.message);
  }
}

/**
 * Main service loop
 */
async function run() {
  console.log('[Processor] Queue processor service starting...');
  console.log(`[Processor] Queue directory: ${QUEUE_DIR}`);
  console.log(`[Processor] Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`[Processor] Session store: ${SESSION_STORE}`);
  console.log('[Processor] Ready to process requests\n');
  
  // Main loop
  while (true) {
    try {
      await processQueue();
    } catch (err) {
      console.error('[Processor] Loop error:', err);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Processor] Received SIGTERM, shutting down gracefully...');
  saveSessions();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Processor] Received SIGINT, shutting down gracefully...');
  saveSessions();
  process.exit(0);
});

// Start service
if (require.main === module) {
  run().catch(err => {
    console.error('[Processor] Fatal error:', err);
    process.exit(1);
  });
}
