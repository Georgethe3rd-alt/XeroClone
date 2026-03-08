#!/usr/bin/env node
/**
 * Dashboard Agent Webhook
 * 
 * Receives agent spawn/message requests from dashboard
 * Uses OpenClaw sessions_spawn and sessions_send tools
 * Returns responses via callback URL
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.WEBHOOK_PORT || 3005;

app.use(express.json());

// Queue directories
const QUEUE_DIR = '/data/.openclaw/workspace/webhook-queue';
const RESPONSES_DIR = '/data/.openclaw/workspace/webhook-responses';

// Ensure directories exist
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });

// Track active agent sessions
const agentSessions = new Map();

// Agent workspace paths
const AGENT_WORKSPACES = {
  ryan: '/data/.openclaw/workspace/agents/ryan',
  brian: '/data/.openclaw/workspace/agents/brian',
  keisha: '/data/.openclaw/workspace/agents/keisha'
};

// Ensure all workspaces exist
Object.values(AGENT_WORKSPACES).forEach(workspace => {
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
    console.log(`[Webhook] Created workspace: ${workspace}`);
  }
});

/**
 * POST /webhook/agent/spawn
 * Body: { agentId, type, model, callbackUrl }
 */
app.post('/webhook/agent/spawn', async (req, res) => {
  const { agentId, type, model, callbackUrl } = req.body;
  
  console.log(`[Webhook] Spawn request: ${agentId} (${type}, ${model})`);
  
  // Check if already spawned
  if (agentSessions.has(agentId)) {
    const sessionKey = agentSessions.get(agentId);
    console.log(`[Webhook] ${agentId} already spawned: ${sessionKey}`);
    
    return res.json({
      success: true,
      sessionKey,
      cached: true
    });
  }
  
  // Prepare spawn request
  const workspace = AGENT_WORKSPACES[agentId] || `/data/.openclaw/workspace/agents/${agentId}`;
  const memory = `${workspace}/memory.md`;
  
  const spawnData = {
    action: 'spawn',
    agentId,
    type,
    model,
    workspace,
    memory,
    callbackUrl
  };
  
  // Write to queue for George to process
  const queueFile = path.join(QUEUE_DIR, `spawn-${agentId}-${Date.now()}.json`);
  fs.writeFileSync(queueFile, JSON.stringify(spawnData, null, 2));
  console.log(`[Webhook] Queued spawn request: ${queueFile}`);
  
  // Return immediate acknowledgment
  res.json({
    success: true,
    spawning: true,
    message: `Spawn request queued for ${agentId}`
  });
});

/**
 * POST /webhook/agent/message
 * Body: { agentId, sessionKey, message, callbackUrl }
 */
app.post('/webhook/agent/message', async (req, res) => {
  const { agentId, sessionKey, message, callbackUrl } = req.body;
  
  console.log(`[Webhook] Message to ${agentId}: "${message.substring(0, 50)}..."`);
  
  // Write to queue for George to process
  const messageData = {
    action: 'message',
    agentId,
    sessionKey,
    message,
    callbackUrl
  };
  
  const queueFile = path.join(QUEUE_DIR, `message-${agentId}-${Date.now()}.json`);
  fs.writeFileSync(queueFile, JSON.stringify(messageData, null, 2));
  console.log(`[Webhook] Queued message request: ${queueFile}`);
  
  // Return immediate acknowledgment
  res.json({
    success: true,
    processing: true,
    message: `Message queued for ${agentId}`
  });
});

/**
 * GET /webhook/agent/status
 */
app.get('/webhook/agent/status', (req, res) => {
  const sessions = {};
  for (const [agentId, sessionKey] of agentSessions.entries()) {
    sessions[agentId] = { sessionKey, status: 'active' };
  }
  
  res.json({
    success: true,
    sessions
  });
});

/**
 * GET /webhook/agent/:id/config
 * Returns agent configuration from workspace
 */
app.get('/webhook/agent/:id/config', (req, res) => {
  const agentId = req.params.id;
  const workspace = AGENT_WORKSPACES[agentId];
  
  if (!workspace) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const configPath = path.join(workspace, 'config.json');
  
  if (!fs.existsSync(configPath)) {
    return res.json({
      agentId,
      workspace,
      personality: {
        primaryTrait: 'Helpful and focused',
        communicationStyle: 'Clear and professional',
        formalityLevel: 'balanced',
        verbosity: 'concise',
        humor: 'occasional',
        expertise: 'General assistance'
      },
      note: 'Default configuration - not yet initialized'
    });
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

/**
 * PUT /webhook/agent/:id/config
 * Updates agent configuration
 */
app.put('/webhook/agent/:id/config', (req, res) => {
  const agentId = req.params.id;
  const { personality } = req.body;
  const workspace = AGENT_WORKSPACES[agentId];
  
  if (!workspace) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!personality) {
    return res.status(400).json({ error: 'Personality configuration required' });
  }
  
  const configPath = path.join(workspace, 'config.json');
  const soulPath = path.join(workspace, 'SOUL.md');
  
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      config = {
        agentId,
        name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
        type: 'subagent',
        created: new Date().toISOString(),
        workspace
      };
    }
    
    config.personality = { ...config.personality, ...personality };
    config.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Update SOUL.md
    if (fs.existsSync(soulPath)) {
      let soul = fs.readFileSync(soulPath, 'utf8');
      
      if (personality.primaryTrait) {
        soul = soul.replace(/- \*\*Primary Trait\*\*:.*/,`- **Primary Trait**: ${personality.primaryTrait}`);
      }
      if (personality.communicationStyle) {
        soul = soul.replace(/- \*\*Communication Style\*\*:.*/,`- **Communication Style**: ${personality.communicationStyle}`);
      }
      if (personality.expertise) {
        soul = soul.replace(/- \*\*Expertise\*\*:.*/,`- **Expertise**: ${personality.expertise}`);
      }
      
      fs.writeFileSync(soulPath, soul);
    }
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dashboard Webhook] Running on port ${PORT}`);
  console.log(`[Dashboard Webhook] Endpoints:`);
  console.log(`  POST /webhook/agent/spawn`);
  console.log(`  POST /webhook/agent/message`);
  console.log(`  GET  /webhook/agent/status`);
  console.log(`  GET  /webhook/agent/:id/config`);
  console.log(`  PUT  /webhook/agent/:id/config`);
  console.log(`\nWaiting for George to wire up sessions_spawn and sessions_send...`);
});
