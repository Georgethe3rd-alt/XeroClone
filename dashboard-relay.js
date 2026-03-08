#!/usr/bin/env node
/**
 * Dashboard Relay Service
 * 
 * Provides HTTP endpoints for the dashboard to spawn and message agents.
 * Uses George's sessions_spawn and sessions_send tools under the hood.
 * 
 * Usage: node dashboard-relay.js [port]
 */

const express = require('express');
const app = express();
const PORT = process.argv[2] || 3001;

app.use(express.json());

// In-memory agent session tracking
const agentSessions = new Map();

/**
 * POST /api/agent/spawn
 * Body: { agentId, type, model, workspace, memory }
 * Returns: { success, sessionKey }
 */
app.post('/api/agent/spawn', async (req, res) => {
  const { agentId, type, model, workspace, memory } = req.body;
  
  console.log(`[Relay] Spawn request for ${agentId}`);
  
  // Check if already spawned
  if (agentSessions.has(agentId)) {
    return res.json({
      success: true,
      sessionKey: agentSessions.get(agentId),
      cached: true
    });
  }
  
  // Prepare spawn parameters
  const spawnParams = {
    runtime: (type === 'claude-code' || type === 'coding-agent') ? 'acp' : 'subagent',
    mode: 'session',
    label: `${agentId}-dashboard-agent`,
    model: model,
    task: `You are ${agentId}. Read your memory at ${memory} for context.`,
    thread: true
  };
  
  if (type === 'claude-code') {
    spawnParams.agentId = 'claude-code';
  }
  
  if (workspace) {
    spawnParams.cwd = workspace;
  }
  
  // TODO: Call OpenClaw sessions_spawn tool
  // For now, return mock response
  const mockSessionKey = `agent:main:subagent:${Date.now()}-${agentId}`;
  agentSessions.set(agentId, mockSessionKey);
  
  console.log(`[Relay] Spawned ${agentId} → ${mockSessionKey}`);
  
  res.json({
    success: true,
    sessionKey: mockSessionKey,
    note: 'Mock session - integrate with OpenClaw tools'
  });
});

/**
 * POST /api/agent/message
 * Body: { agentId, sessionKey, message }
 * Returns: { success, response }
 */
app.post('/api/agent/message', async (req, res) => {
  const { agentId, sessionKey, message } = req.body;
  
  console.log(`[Relay] Message to ${agentId}: ${message.substring(0, 50)}...`);
  
  // TODO: Call OpenClaw sessions_send tool
  // For now, return mock response
  const mockResponse = `[${agentId}] Received your message: "${message}". (Mock response - integrate with OpenClaw tools)`;
  
  console.log(`[Relay] ${agentId} responded`);
  
  res.json({
    success: true,
    response: mockResponse
  });
});

/**
 * GET /api/agent/status
 * Returns: { agents: { agentId: sessionKey } }
 */
app.get('/api/agent/status', (req, res) => {
  const agents = {};
  for (const [agentId, sessionKey] of agentSessions.entries()) {
    agents[agentId] = { sessionKey, status: 'online' };
  }
  
  res.json({ agents });
});

app.listen(PORT, () => {
  console.log(`[Dashboard Relay] Running on port ${PORT}`);
  console.log(`[Dashboard Relay] Endpoints:`);
  console.log(`  POST /api/agent/spawn`);
  console.log(`  POST /api/agent/message`);
  console.log(`  GET  /api/agent/status`);
});
