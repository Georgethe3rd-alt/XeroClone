#!/usr/bin/env node
/**
 * Complete a webhook request
 * 
 * Usage: node complete-webhook-request.js <filename> <result-json>
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';
const SESSION_STORE = '/data/.openclaw/workspace/agent-sessions.json';

const filename = process.argv[2];
const resultJson = process.argv[3];

if (!filename || !resultJson) {
  console.error('Usage: node complete-webhook-request.js <filename> <result-json>');
  process.exit(1);
}

const queuePath = path.join(QUEUE_DIR, filename);
const responsePath = path.join(RESPONSES_DIR, filename);

// Read original request
const request = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const result = JSON.parse(resultJson);

// Write response
fs.writeFileSync(responsePath, JSON.stringify(result, null, 2));

// Send callback if provided
if (request.callbackUrl) {
  axios.post(request.callbackUrl, result)
    .then(() => console.log(`Callback sent to ${request.callbackUrl}`))
    .catch(err => console.error(`Callback failed: ${err.message}`));
}

// Remove from queue
fs.unlinkSync(queuePath);

console.log(`Request ${filename} completed`);
