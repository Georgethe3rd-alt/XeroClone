/**
 * OpenClaw Bridge - Dashboard Integration Layer
 * 
 * Provides real-time agent status from OpenClaw sessions API
 * Routes dashboard messages to OpenClaw agents
 * Syncs dashboard state with OpenClaw reality
 */

const axios = require('axios');

class OpenClawBridge {
  constructor(options = {}) {
    this.gatewayUrl = options.gatewayUrl || 'http://172.18.0.2:18789';
    this.token = options.token || process.env.OPENCLAW_TOKEN;
  }

  /**
   * Get all active OpenClaw sessions
   */
  async getSessions() {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'sessions.list',
        params: {
          limit: 50,
          messageLimit: 5
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 5000
      });
      return response.data.result?.sessions || [];
    } catch (error) {
      console.error('[OpenClawBridge] Failed to get sessions:', error.message);
      return [];
    }
  }

  /**
   * Get session history for a specific agent
   */
  async getSessionHistory(sessionKey, limit = 20) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'sessions.history',
        params: { sessionKey, limit }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 5000
      });
      return response.data.result?.messages || [];
    } catch (error) {
      console.error('[OpenClawBridge] Failed to get history:', error.message);
      return [];
    }
  }

  /**
   * Send message to an OpenClaw agent
   */
  async sendMessage(agentId, message) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'sessions.send',
        params: {
          label: agentId,
          message: message,
          timeoutSeconds: 60
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 65000
      });
      return response.data.result;
    } catch (error) {
      console.error('[OpenClawBridge] Failed to send message:', error.message);
      throw error;
    }
  }

  /**
   * Spawn a new agent session
   */
  async spawnAgent(agentId, task, options = {}) {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'sessions.spawn',
        params: {
          task: task,
          label: agentId,
          mode: options.mode || 'session',
          agentId: agentId,
          model: options.model,
          cwd: options.workspace,
          thread: options.thread || false,
          timeoutSeconds: options.timeoutSeconds || 300
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 5000
      });
      return response.data.result;
    } catch (error) {
      console.error('[OpenClawBridge] Failed to spawn agent:', error.message);
      throw error;
    }
  }

  /**
   * Get agent configuration from OpenClaw
   */
  async getAgentConfig() {
    try {
      const response = await axios.post(`${this.gatewayUrl}/rpc`, {
        method: 'config.get',
        params: { path: 'agents' }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 5000
      });
      return response.data.result;
    } catch (error) {
      console.error('[OpenClawBridge] Failed to get agent config:', error.message);
      return null;
    }
  }

  /**
   * Map OpenClaw sessions to dashboard agent status
   */
  mapSessionsToAgents(sessions, configuredAgents) {
    const agentStatus = {};
    
    // Initialize all configured agents as idle
    for (const agentId of Object.keys(configuredAgents)) {
      agentStatus[agentId] = {
        status: 'idle',
        sessionKey: null,
        lastActivity: null,
        messages: []
      };
    }

    // Update with active session data
    for (const session of sessions) {
      const label = session.label || session.sessionKey;
      const agentId = this.extractAgentId(label);
      
      if (agentId && agentStatus[agentId]) {
        agentStatus[agentId] = {
          status: session.thinking ? 'thinking' : 'active',
          sessionKey: session.sessionKey,
          lastActivity: session.lastMessageAt,
          messages: session.messages || [],
          model: session.model
        };
      }
    }

    return agentStatus;
  }

  /**
   * Extract agent ID from session label
   */
  extractAgentId(label) {
    if (!label) return null;
    
    // Handle labels like "scout-heartbeat-agent", "ryan-dashboard-agent"
    const match = label.match(/^(scout|ryan|brian|keisha|george|lama)/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Health check
   */
  async ping() {
    try {
      const response = await axios.get(`${this.gatewayUrl}/`, {
        timeout: 2000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = OpenClawBridge;
