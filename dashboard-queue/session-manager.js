#!/usr/bin/env node
/**
 * Session Manager - Tracks active agent sessions
 * Maintains conversation continuity for dashboard agents
 */

const fs = require('fs');
const path = require('path');

const SESSION_STATE_FILE = '/data/.openclaw/workspace/dashboard-queue/sessions.json';

class SessionManager {
  constructor() {
    this.sessions = this.loadState();
  }

  loadState() {
    if (fs.existsSync(SESSION_STATE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf8'));
      } catch (error) {
        console.error('[SessionManager] Error loading state:', error.message);
        return {};
      }
    }
    return {};
  }

  saveState() {
    try {
      fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('[SessionManager] Error saving state:', error.message);
    }
  }

  hasSession(agentId) {
    return this.sessions[agentId] && this.sessions[agentId].sessionKey;
  }

  getSessionKey(agentId) {
    return this.sessions[agentId]?.sessionKey;
  }

  registerSession(agentId, sessionKey, label) {
    this.sessions[agentId] = {
      sessionKey,
      label,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };
    this.saveState();
    console.log(`[SessionManager] Registered ${agentId}: ${sessionKey}`);
  }

  updateLastUsed(agentId) {
    if (this.sessions[agentId]) {
      this.sessions[agentId].lastUsed = Date.now();
      this.saveState();
    }
  }

  clearSession(agentId) {
    if (this.sessions[agentId]) {
      delete this.sessions[agentId];
      this.saveState();
      console.log(`[SessionManager] Cleared ${agentId} session`);
    }
  }

  listSessions() {
    return Object.entries(this.sessions).map(([agentId, data]) => ({
      agentId,
      ...data
    }));
  }
}

module.exports = SessionManager;
