#!/usr/bin/env node
/**
 * Queue Processor
 * Polls queue directory, spawns OpenClaw agents, writes responses
 * Run this via: node process-queue.js or as a periodic task
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = '/data/.openclaw/workspace/dashboard-queue';
const REQUESTS_DIR = path.join(QUEUE_DIR, 'requests');
const RESPONSES_DIR = path.join(QUEUE_DIR, 'responses');
const PROCESSING_DIR = path.join(QUEUE_DIR, 'processing');

// Ensure processing directory exists
if (!fs.existsSync(PROCESSING_DIR)) {
  fs.mkdirSync(PROCESSING_DIR, { recursive: true });
}

const agentConfig = {
  scout: { model: 'anthropic/claude-haiku-4-5', workspace: '/data/.openclaw/workspace/agents/heartbeat' },
  ryan: { model: 'anthropic/claude-sonnet-4-5', workspace: '/data/.openclaw/workspace/agents/ryan' },
  brian: { model: 'anthropic/claude-sonnet-4-5', workspace: '/data/.openclaw/workspace/agents/brian' },
  keisha: { model: 'openai/gpt-4.1', workspace: '/data/.openclaw/workspace/agents/keisha' }
};

console.log('[QueueProcessor] Checking queue...');

// Read all request files
const requestFiles = fs.readdirSync(REQUESTS_DIR).filter(f => f.endsWith('.json'));

if (requestFiles.length === 0) {
  console.log('[QueueProcessor] No pending requests');
  process.exit(0);
}

console.log(`[QueueProcessor] Found ${requestFiles.length} pending request(s)`);

// Process each request
for (const filename of requestFiles) {
  const requestFile = path.join(REQUESTS_DIR, filename);
  const processingFile = path.join(PROCESSING_DIR, filename);
  
  try {
    // Move to processing to avoid double-processing
    fs.renameSync(requestFile, processingFile);
    
    const task = JSON.parse(fs.readFileSync(processingFile, 'utf8'));
    const { requestId, agentId, message } = task;

    console.log(`[QueueProcessor] Processing ${requestId}: ${agentId}`);

    if (!agentConfig[agentId]) {
      writeResponse(requestId, {
        requestId,
        status: 'error',
        error: `Unknown agent: ${agentId}`
      });
      fs.unlinkSync(processingFile);
      continue;
    }

    // Output instructions for George to execute
    console.log(`\n=== SPAWN REQUEST ===`);
    console.log(`Agent: ${agentId}`);
    console.log(`Message: ${message}`);
    console.log(`RequestID: ${requestId}`);
    console.log(`\nGeorge: Please spawn this agent using sessions_spawn`);
    console.log(`===================\n`);

    // Mark as processing
    writeResponse(requestId, {
      requestId,
      status: 'processing',
      agentId,
      note: 'Agent is being spawned...'
    });

    // Delete processing file
    fs.unlinkSync(processingFile);

  } catch (error) {
    console.error(`[QueueProcessor] Error processing ${filename}:`, error.message);
    // Move back to requests on error
    if (fs.existsSync(processingFile)) {
      fs.renameSync(processingFile, requestFile);
    }
  }
}

function writeResponse(requestId, data) {
  const responseFile = path.join(RESPONSES_DIR, `${requestId}.json`);
  fs.writeFileSync(responseFile, JSON.stringify(data, null, 2));
}

console.log('[QueueProcessor] Queue processing complete');
