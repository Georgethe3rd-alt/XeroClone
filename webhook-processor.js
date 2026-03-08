#!/usr/bin/env node
/**
 * Webhook Request Processor
 * 
 * Reads webhook requests from queue and processes them using OpenClaw tools
 * This script is called BY George (in his session context) where tools are available
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';

// Ensure directories exist
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });

// Track active sessions
const sessionStore = path.join(__dirname, 'agent-sessions.json');
let sessions = {};
if (fs.existsSync(sessionStore)) {
  sessions = JSON.parse(fs.readFileSync(sessionStore, 'utf8'));
}

function saveSessions() {
  fs.writeFileSync(sessionStore, JSON.stringify(sessions, null, 2));
}

/**
 * Process a spawn request
 */
async function processSpawn(request) {
  const { agentId, type, model, workspace, memory, callbackUrl } = request;
  
  console.log(`[Processor] Processing spawn: ${agentId}`);
  
  // Check if already spawned
  if (sessions[agentId]) {
    console.log(`[Processor] ${agentId} already spawned: ${sessions[agentId]}`);
    return {
      success: true,
      sessionKey: sessions[agentId],
      cached: true
    };
  }
  
  // TODO: Call sessions_spawn tool
  // For now, return placeholder
  const sessionKey = `test-${agentId}-${Date.now()}`;
  sessions[agentId] = sessionKey;
  saveSessions();
  
  console.log(`[Processor] Spawned ${agentId}: ${sessionKey}`);
  
  // Notify callback
  if (callbackUrl) {
    try {
      await axios.post(callbackUrl, {
        type: 'spawn_complete',
        agentId,
        sessionKey,
        status: 'online'
      });
    } catch (err) {
      console.error(`[Processor] Callback failed:`, err.message);
    }
  }
  
  return { success: true, sessionKey };
}

/**
 * Process a message request
 */
async function processMessage(request) {
  const { agentId, sessionKey, message, callbackUrl } = request;
  
  console.log(`[Processor] Processing message to ${agentId}: "${message.substring(0, 50)}..."`);
  
  // TODO: Call sessions_send tool
  // For now, return placeholder
  const response = `Hello! I'm ${agentId}. You said: "${message}"\n\n(Placeholder - waiting for sessions_send integration)`;
  
  // Notify callback
  if (callbackUrl) {
    try {
      await axios.post(callbackUrl, {
        type: 'agent_response',
        agentId,
        message: response
      });
    } catch (err) {
      console.error(`[Processor] Callback failed:`, err.message);
    }
  }
  
  return { success: true, response };
}

/**
 * Process all pending requests in queue
 */
async function processQueue() {
  const files = fs.readdirSync(QUEUE_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(QUEUE_DIR, file);
    try {
      const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`[Processor] Processing ${file}: ${request.action}`);
      
      let result;
      if (request.action === 'spawn') {
        result = await processSpawn(request);
      } else if (request.action === 'message') {
        result = await processMessage(request);
      }
      
      // Write response
      const responseFile = path.join(RESPONSES_DIR, file);
      fs.writeFileSync(responseFile, JSON.stringify(result, null, 2));
      
      // Remove from queue
      fs.unlinkSync(filePath);
      
    } catch (err) {
      console.error(`[Processor] Error processing ${file}:`, err);
    }
  }
}

// Run if called directly
if (require.main === module) {
  console.log(`[Processor] Processing webhook queue...`);
  processQueue().then(() => {
    console.log(`[Processor] Done`);
  }).catch(err => {
    console.error(`[Processor] Error:`, err);
    process.exit(1);
  });
}

module.exports = { processQueue, processSpawn, processMessage };
