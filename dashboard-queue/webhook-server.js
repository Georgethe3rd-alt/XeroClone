#!/usr/bin/env node
/**
 * Dashboard Queue Webhook
 * Writes agent tasks to file queue, responds to dashboard
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const QUEUE_DIR = '/data/.openclaw/workspace/dashboard-queue';
const REQUESTS_DIR = path.join(QUEUE_DIR, 'requests');
const RESPONSES_DIR = path.join(QUEUE_DIR, 'responses');

console.log('[QueueWebhook] Starting...');

// POST /agent/:id - Queue a message to an agent
app.post('/agent/:id', async (req, res) => {
  const agentId = req.params.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const requestId = `${agentId}-${Date.now()}`;
    const requestFile = path.join(REQUESTS_DIR, `${requestId}.json`);

    const task = {
      requestId,
      agentId,
      message,
      timestamp: Date.now(),
      status: 'queued'
    };

    fs.writeFileSync(requestFile, JSON.stringify(task, null, 2));
    console.log(`[QueueWebhook] Queued ${requestId}`);

    res.json({
      success: true,
      requestId,
      agentId,
      status: 'queued',
      note: 'Task queued, check /status/:requestId for completion'
    });

  } catch (error) {
    console.error('[QueueWebhook] Error queuing:', error.message);
    res.status(500).json({ error: 'Failed to queue task' });
  }
});

// GET /status/:requestId - Check if response is ready
app.get('/status/:requestId', (req, res) => {
  const requestId = req.params.requestId;
  const responseFile = path.join(RESPONSES_DIR, `${requestId}.json`);

  try {
    if (fs.existsSync(responseFile)) {
      const response = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
      res.json(response);
    } else {
      res.json({
        requestId,
        status: 'pending',
        note: 'Response not ready yet'
      });
    }
  } catch (error) {
    console.error('[QueueWebhook] Error checking status:', error.message);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'queue-webhook' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[QueueWebhook] Listening on 0.0.0.0:${PORT}`);
});
