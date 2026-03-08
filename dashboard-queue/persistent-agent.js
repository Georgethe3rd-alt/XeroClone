#!/usr/bin/env node
/**
 * Persistent Dashboard Agent
 * Stays alive, polls queue for tasks, maintains conversation memory
 */

const fs = require('fs');
const path = require('path');

const AGENT_ID = process.env.AGENT_ID || 'scout';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 5000; // 5 seconds

const QUEUE_DIR = '/data/.openclaw/workspace/dashboard-queue';
const REQUESTS_DIR = path.join(QUEUE_DIR, 'requests');
const RESPONSES_DIR = path.join(QUEUE_DIR, 'responses');
const PROCESSING_DIR = path.join(QUEUE_DIR, 'processing');

const agentConfig = {
  scout: {
    name: 'Scout',
    workspace: '/data/.openclaw/workspace/agents/heartbeat',
    description: 'Heartbeat monitoring agent'
  },
  ryan: {
    name: 'Ryan',
    workspace: '/data/.openclaw/workspace/agents/ryan',
    description: 'Technical specialist'
  },
  brian: {
    name: 'Brian',
    workspace: '/data/.openclaw/workspace/agents/brian',
    description: 'Research specialist'
  },
  keisha: {
    name: 'Keisha',
    workspace: '/data/.openclaw/workspace/agents/keisha',
    description: 'Creative specialist'
  }
};

const config = agentConfig[AGENT_ID];
if (!config) {
  console.error(`Unknown agent: ${AGENT_ID}`);
  process.exit(1);
}

// In-memory conversation history
const conversationHistory = [];

console.log(`[${config.name}] Starting persistent agent...`);
console.log(`[${config.name}] Workspace: ${config.workspace}`);
console.log(`[${config.name}] Polling interval: ${POLL_INTERVAL}ms`);

// Load identity on startup
loadIdentity();

// Main polling loop
setInterval(() => {
  checkQueue();
}, POLL_INTERVAL);

function loadIdentity() {
  const identityFile = path.join(config.workspace, 'IDENTITY.md');
  const soulFile = path.join(config.workspace, 'SOUL.md');
  
  let identity = '';
  
  if (fs.existsSync(identityFile)) {
    identity += fs.readFileSync(identityFile, 'utf8') + '\n\n';
  }
  
  if (fs.existsSync(soulFile)) {
    identity += fs.readFileSync(soulFile, 'utf8');
  }
  
  if (identity) {
    conversationHistory.push({
      role: 'system',
      content: identity,
      timestamp: Date.now()
    });
    console.log(`[${config.name}] Identity loaded`);
  }
}

function checkQueue() {
  try {
    const files = fs.readdirSync(REQUESTS_DIR)
      .filter(f => f.startsWith(`${AGENT_ID}-`) && f.endsWith('.json'));
    
    if (files.length === 0) return;
    
    // Process oldest request first
    files.sort();
    const filename = files[0];
    const requestFile = path.join(REQUESTS_DIR, filename);
    
    processRequest(requestFile);
    
  } catch (error) {
    console.error(`[${config.name}] Error checking queue:`, error.message);
  }
}

function processRequest(requestFile) {
  try {
    // Move to processing
    const filename = path.basename(requestFile);
    const processingFile = path.join(PROCESSING_DIR, filename);
    fs.renameSync(requestFile, processingFile);
    
    // Read task
    const task = JSON.parse(fs.readFileSync(processingFile, 'utf8'));
    const { requestId, message } = task;
    
    console.log(`[${config.name}] Processing: ${message.substring(0, 50)}...`);
    
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    // Generate response (placeholder - actual LLM integration needed)
    const response = generateResponse(message);
    
    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });
    
    // Write response
    const responseFile = path.join(RESPONSES_DIR, `${requestId}.json`);
    fs.writeFileSync(responseFile, JSON.stringify({
      requestId,
      status: 'done',
      response,
      timestamp: Date.now(),
      conversationLength: conversationHistory.filter(m => m.role !== 'system').length
    }, null, 2));
    
    console.log(`[${config.name}] Response written for ${requestId}`);
    
    // Clean up processing file
    fs.unlinkSync(processingFile);
    
  } catch (error) {
    console.error(`[${config.name}] Error processing request:`, error.message);
  }
}

function generateResponse(message) {
  // Placeholder response generator
  // In production, this would call sessions_spawn or use LLM API
  
  const historyLength = conversationHistory.filter(m => m.role !== 'system').length;
  
  if (historyLength === 1) {
    return `Hello! I'm ${config.name}, your ${config.description}. I'm ready to help you. What would you like me to do?`;
  }
  
  // Echo back with context awareness
  const previousMessages = conversationHistory
    .filter(m => m.role !== 'system')
    .slice(-3)
    .map(m => `${m.role}: ${m.content.substring(0, 30)}`)
    .join('; ');
  
  return `I received: "${message}". This is message #${historyLength/2} in our conversation. Context: ${previousMessages}. [Placeholder response - LLM integration needed]`;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[${config.name}] Shutting down gracefully...`);
  console.log(`[${config.name}] Processed ${conversationHistory.filter(m => m.role === 'user').length} messages`);
  process.exit(0);
});

console.log(`[${config.name}] Ready. Waiting for tasks...`);
