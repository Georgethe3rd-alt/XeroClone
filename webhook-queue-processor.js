#!/usr/bin/env node
/**
 * Webhook Queue Processor
 * Processes queued webhook requests and uses OpenClaw tools
 * This runs IN George's context where tools are available
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';
const SESSION_STORE = '/data/.openclaw/workspace/agent-sessions.json';
const PROCESSING_DIR = '/data/.openclaw/workspace/webhook-processing';

// Ensure directories exist
[QUEUE_DIR, RESPONSES_DIR, PROCESSING_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load session state
let sessions = {};
if (fs.existsSync(SESSION_STORE)) {
  try {
    sessions = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
  } catch (err) {
    console.error('Failed to load sessions:', err.message);
    sessions = {};
  }
}

function saveSessions() {
  fs.writeFileSync(SESSION_STORE, JSON.stringify(sessions, null, 2));
}

/**
 * Get pending requests from queue
 */
function getPendingRequests() {
  const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const filePath = path.join(QUEUE_DIR, file);
    try {
      const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { file, filePath, request };
    } catch (err) {
      console.error(`Failed to read ${file}:`, err.message);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Move request to processing
 */
function moveToProcessing(file) {
  const src = path.join(QUEUE_DIR, file);
  const dest = path.join(PROCESSING_DIR, file);
  fs.renameSync(src, dest);
  return dest;
}

/**
 * Complete a request
 */
function completeRequest(file, result) {
  const processingPath = path.join(PROCESSING_DIR, file);
  const responsePath = path.join(RESPONSES_DIR, file);
  
  // Write response
  fs.writeFileSync(responsePath, JSON.stringify(result, null, 2));
  
  // Remove from processing
  if (fs.existsSync(processingPath)) {
    fs.unlinkSync(processingPath);
  }
}

/**
 * Send callback
 */
async function sendCallback(callbackUrl, data) {
  if (!callbackUrl) return;
  
  try {
    await axios.post(callbackUrl, data, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[Callback] Sent to ${callbackUrl}`);
  } catch (err) {
    console.error(`[Callback] Failed to ${callbackUrl}:`, err.message);
  }
}

/**
 * Process spawn requests - outputs instructions for George
 */
function processSpawnRequests(pending) {
  const spawns = pending.filter(p => p.request.action === 'spawn');
  if (spawns.length === 0) return null;
  
  return spawns.map(({ file, request }) => {
    const { agentId, model, workspace, callbackUrl } = request;
    
    // Check if already spawned
    if (sessions[agentId]) {
      console.log(`[Processor] ${agentId} already spawned: ${sessions[agentId]}`);
      return {
        file,
        agentId,
        action: 'already_spawned',
        sessionKey: sessions[agentId],
        callbackUrl
      };
    }
    
    return {
      file,
      agentId,
      action: 'spawn_needed',
      model: model || 'anthropic/claude-sonnet-4-5',
      workspace,
      callbackUrl
    };
  });
}

/**
 * Process message requests - outputs instructions for George
 */
function processMessageRequests(pending) {
  const messages = pending.filter(p => p.request.action === 'message');
  if (messages.length === 0) return null;
  
  return messages.map(({ file, request }) => {
    const { agentId, sessionKey, message, callbackUrl } = request;
    
    // Verify session exists
    const actualSessionKey = sessionKey || sessions[agentId];
    if (!actualSessionKey) {
      console.error(`[Processor] No session for ${agentId}`);
      return {
        file,
        agentId,
        action: 'error',
        error: `Agent ${agentId} not spawned`,
        callbackUrl
      };
    }
    
    return {
      file,
      agentId,
      action: 'send_message',
      sessionKey: actualSessionKey,
      message,
      callbackUrl
    };
  });
}

// Main execution
const pending = getPendingRequests();

if (pending.length === 0) {
  console.log(JSON.stringify({ status: 'empty', pending: 0 }));
  process.exit(0);
}

const spawns = processSpawnRequests(pending);
const messages = processMessageRequests(pending);

console.log(JSON.stringify({
  status: 'pending',
  count: pending.length,
  sessions,
  spawns,
  messages
}, null, 2));
