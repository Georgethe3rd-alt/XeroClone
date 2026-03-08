#!/usr/bin/env node
/**
 * George Message Processor
 * 
 * Processes dashboard messages directed at George (me) and responds directly
 * Other agents get spawned via sessions_spawn, but George messages come here
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const GEORGE_INBOX = '/data/.openclaw/workspace/george-inbox';
const GEORGE_OUTBOX = '/data/.openclaw/workspace/george-outbox';

// Ensure directories exist
[GEORGE_INBOX, GEORGE_OUTBOX].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Extract George messages from queue and move to inbox
 */
function extractGeorgeMessages() {
  if (!fs.existsSync(QUEUE_DIR)) return [];
  
  const queueFiles = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'));
  const georgeMessages = [];
  
  for (const file of queueFiles) {
    const filePath = path.join(QUEUE_DIR, file);
    try {
      const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (request.agentId === 'george' && request.action === 'message') {
        // Move to George's inbox
        const inboxPath = path.join(GEORGE_INBOX, file);
        fs.renameSync(filePath, inboxPath);
        georgeMessages.push({ file, request, inboxPath });
      }
    } catch (err) {
      console.error(`Failed to process ${file}:`, err.message);
    }
  }
  
  return georgeMessages;
}

/**
 * List pending messages for George
 */
function listPendingMessages() {
  const files = fs.existsSync(GEORGE_INBOX) 
    ? fs.readdirSync(GEORGE_INBOX).filter(f => f.endsWith('.json'))
    : [];
  
  return files.map(file => {
    const filePath = path.join(GEORGE_INBOX, file);
    const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      message: request.message,
      callbackUrl: request.callbackUrl,
      timestamp: request.timestamp || Date.now()
    };
  });
}

/**
 * Send response back to dashboard
 */
async function sendResponse(file, responseText) {
  const inboxPath = path.join(GEORGE_INBOX, file);
  const request = JSON.parse(fs.readFileSync(inboxPath, 'utf8'));
  
  // Write to outbox for tracking
  const outboxPath = path.join(GEORGE_OUTBOX, file);
  const response = {
    type: 'agent_response',
    agentId: 'george',
    message: responseText,
    timestamp: Date.now()
  };
  fs.writeFileSync(outboxPath, JSON.stringify(response, null, 2));
  
  // Send callback if URL provided
  if (request.callbackUrl) {
    try {
      const axios = require('axios');
      await axios.post(request.callbackUrl, response, { timeout: 5000 });
      console.log(`[George] Response sent via callback: ${file}`);
    } catch (err) {
      console.error(`[George] Callback failed: ${err.message}`);
    }
  }
  
  // Remove from inbox (processed)
  fs.unlinkSync(inboxPath);
  
  return response;
}

// Command-line interface
const command = process.argv[2];

if (command === 'extract') {
  // Extract George messages from main queue
  const messages = extractGeorgeMessages();
  console.log(JSON.stringify({ 
    status: 'extracted',
    count: messages.length,
    messages: messages.map(m => ({ file: m.file, message: m.request.message }))
  }, null, 2));
  
} else if (command === 'list') {
  // List pending messages
  const pending = listPendingMessages();
  console.log(JSON.stringify({
    status: 'pending',
    count: pending.length,
    messages: pending
  }, null, 2));
  
} else if (command === 'respond') {
  // Respond to a specific message
  const file = process.argv[3];
  const response = process.argv[4];
  
  if (!file || !response) {
    console.error('Usage: node process-george-messages.js respond <file> <response>');
    process.exit(1);
  }
  
  sendResponse(file, response)
    .then(() => {
      console.log(`[George] Responded to ${file}`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`[George] Failed to respond: ${err.message}`);
      process.exit(1);
    });
  
} else {
  // Auto mode: extract and list
  const extracted = extractGeorgeMessages();
  const pending = listPendingMessages();
  
  console.log(JSON.stringify({
    status: 'ready',
    extracted: extracted.length,
    pending: pending.length,
    messages: pending
  }, null, 2));
}
