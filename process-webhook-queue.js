#!/usr/bin/env node
/**
 * Webhook Queue Processor - George Edition
 * 
 * This script is meant to be TRIGGERED by George in his session context
 * It reads the queue and OUTPUTS tool calls for George to execute
 * 
 * Usage: George runs this, gets the tool calls, executes them, then processes results
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';
const SESSION_STORE = '/data/.openclaw/workspace/agent-sessions.json';

// Ensure directories exist
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });

// Load session state
let sessions = {};
if (fs.existsSync(SESSION_STORE)) {
  sessions = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
}

function saveSessions() {
  fs.writeFileSync(SESSION_STORE, JSON.stringify(sessions, null, 2));
}

// Read all pending requests
const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.log(JSON.stringify({ status: 'empty', pending: 0 }));
  process.exit(0);
}

// Output pending requests as structured data
const pending = files.map(file => {
  const filePath = path.join(QUEUE_DIR, file);
  const request = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    file,
    filePath,
    action: request.action,
    agentId: request.agentId,
    request
  };
});

console.log(JSON.stringify({
  status: 'pending',
  count: pending.length,
  sessions,
  requests: pending
}, null, 2));
