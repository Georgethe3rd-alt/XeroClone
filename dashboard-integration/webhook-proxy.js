#!/usr/bin/env node
/**
 * Dashboard Webhook Proxy
 * 
 * Runs inside OpenClaw container, accessible from host
 * Routes dashboard messages to OpenClaw agents via sessions API
 * Provides status updates back to dashboard
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3006;
const OPENCLAW_RPC = 'http://127.0.0.1:18789/rpc';

// In-memory cache of recent agent responses
const responseCache = new Map();

// Agent configuration
const agents = {
  scout: { workspace: '/data/.openclaw/workspace/agents/heartbeat', model: 'anthropic/claude-haiku-4-5' },
  ryan: { workspace: '/data/.openclaw/workspace/agents/ryan', model: 'anthropic/claude-sonnet-4-5' },
  brian: { workspace: '/data/.openclaw/workspace/agents/brian', model: 'anthropic/claude-sonnet-4-5' },
  keisha: { workspace: '/data/.openclaw/workspace/agents/keisha', model: 'openai/gpt-4.1' },
  george: { workspace: '/data/.openclaw/workspace', model: 'anthropic/claude-sonnet-4-5' }
};

console.log('[WebhookProxy] Starting dashboard webhook proxy...');

/**
 * POST /webhook/agent/:id
 * Send message to an agent
 */
app.post('/webhook/agent/:id', async (req, res) => {
  const agentId = req.params.id;
  const { message } = req.body;

  if (!agents[agentId]) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    console.log(`[WebhookProxy] Spawning ${agentId} with message: ${message.substring(0, 50)}...`);

    const agent = agents[agentId];
    
    // Spawn agent session
    const spawnResponse = await axios.post(OPENCLAW_RPC, {
      method: 'sessions.spawn',
      params: {
        task: message,
        label: `${agentId}-dashboard`,
        mode: 'run',
        model: agent.model,
        cwd: agent.workspace,
        runTimeoutSeconds: 120
      }
    });

    const result = spawnResponse.data.result;
    
    // Store in cache for status polling
    const requestId = Date.now().toString();
    responseCache.set(requestId, {
      agentId,
      status: 'pending',
      sessionKey: result.childSessionKey,
      runId: result.runId,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      requestId,
      agentId,
      sessionKey: result.childSessionKey,
      note: 'Agent spawned, response will arrive via auto-announce'
    });

  } catch (error) {
    console.error(`[WebhookProxy] Error spawning ${agentId}:`, error.message);
    res.status(500).json({ error: 'Failed to spawn agent: ' + error.message });
  }
});

/**
 * GET /webhook/status/:requestId
 * Check status of a spawned agent
 */
app.get('/webhook/status/:requestId', async (req, res) => {
  const requestId = req.params.requestId;
  const cached = responseCache.get(requestId);

  if (!cached) {
    return res.status(404).json({ error: 'Request not found' });
  }

  try {
    // Query subagents to see if this run completed
    const subagentsResponse = await axios.post(OPENCLAW_RPC, {
      method: 'subagents.list',
      params: {}
    });

    const runs = [...(subagentsResponse.data.result.active || []), ...(subagentsResponse.data.result.recent || [])];
    const run = runs.find(r => r.runId === cached.runId);

    if (run && run.status === 'done') {
      // Fetch the session history to get the response
      const historyResponse = await axios.post(OPENCLAW_RPC, {
        method: 'sessions.history',
        params: {
          sessionKey: cached.sessionKey,
          limit: 5
        }
      });

      const messages = historyResponse.data.result.messages || [];
      const lastAssistantMessage = messages.reverse().find(m => m.role === 'assistant');

      const response = {
        status: 'done',
        agentId: cached.agentId,
        message: lastAssistantMessage ? extractContent(lastAssistantMessage.content) : 'No response',
        timestamp: cached.timestamp
      };

      responseCache.set(requestId, response);
      return res.json(response);
    }

    res.json({
      status: run ? run.status : 'pending',
      agentId: cached.agentId,
      timestamp: cached.timestamp
    });

  } catch (error) {
    console.error(`[WebhookProxy] Error checking status:`, error.message);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * GET /webhook/agents
 * List all agents and their current status
 */
app.get('/webhook/agents', async (req, res) => {
  try {
    const sessionsResponse = await axios.post(OPENCLAW_RPC, {
      method: 'sessions.list',
      params: { limit: 50, messageLimit: 5 }
    });

    const sessions = sessionsResponse.data.result.sessions || [];
    const agentStatus = {};

    // Initialize all agents as idle
    for (const id of Object.keys(agents)) {
      agentStatus[id] = {
        id,
        status: 'idle',
        sessionKey: null,
        lastActivity: null
      };
    }

    // Update with active session data
    for (const session of sessions) {
      const agentId = extractAgentId(session.label || session.sessionKey);
      if (agentId && agentStatus[agentId]) {
        agentStatus[agentId] = {
          id: agentId,
          status: session.thinking ? 'thinking' : 'active',
          sessionKey: session.sessionKey,
          lastActivity: session.lastMessageAt
        };
      }
    }

    // George is always online
    if (agentStatus.george) {
      agentStatus.george.status = 'online';
    }

    res.json(agentStatus);
  } catch (error) {
    console.error('[WebhookProxy] Error fetching agents:', error.message);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dashboard-webhook-proxy',
    agents: Object.keys(agents).length
  });
});

// Helper functions
function extractAgentId(label) {
  if (!label) return null;
  const match = label.match(/^(scout|ryan|brian|keisha|george)-/i);
  return match ? match[1].toLowerCase() : null;
}

function extractContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content) && content[0] && content[0].text) return content[0].text;
  return JSON.stringify(content);
}

// Cleanup old cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      responseCache.delete(key);
    }
  }
}, 300000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WebhookProxy] Listening on 0.0.0.0:${PORT}`);
  console.log(`[WebhookProxy] Dashboard can reach at http://172.18.0.2:${PORT}`);
  console.log(`[WebhookProxy] Agents configured: ${Object.keys(agents).join(', ')}`);
});
