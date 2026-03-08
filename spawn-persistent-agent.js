#!/usr/bin/env node
/**
 * Spawn Persistent Agent
 * 
 * Creates a fully-featured persistent agent with:
 * - Dedicated workspace directory
 * - SOUL.md (personality definition)
 * - MEMORY.md (long-term memory)
 * - config.json (agent configuration)
 * 
 * The agent persists across restarts and maintains conversation context.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/data/.openclaw/workspace/agents';
const TEMPLATES_DIR = '/data/.openclaw/workspace/agent-templates';
const SESSION_STORE = '/data/.openclaw/workspace/agent-sessions.json';

/**
 * Create agent workspace with soul, memory, and config
 */
function createAgentWorkspace(agentId, agentName, personality = {}) {
  const agentDir = path.join(AGENTS_DIR, agentId);
  
  // Create directory
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }
  
  const now = new Date().toISOString().split('T')[0];
  
  // Create SOUL.md from template
  let soul = fs.readFileSync(path.join(TEMPLATES_DIR, 'SOUL-TEMPLATE.md'), 'utf8');
  soul = soul.replace(/{AGENT_NAME}/g, agentName);
  soul = soul.replace(/{CREATED_DATE}/g, now);
  
  // Apply personality customizations if provided
  if (personality.primaryTrait) {
    soul = soul.replace('Helpful and focused', personality.primaryTrait);
  }
  if (personality.communicationStyle) {
    soul = soul.replace('Clear and professional', personality.communicationStyle);
  }
  if (personality.expertise) {
    soul = soul.replace('General assistance', personality.expertise);
  }
  
  fs.writeFileSync(path.join(agentDir, 'SOUL.md'), soul);
  
  // Create MEMORY.md from template
  let memory = fs.readFileSync(path.join(TEMPLATES_DIR, 'MEMORY-TEMPLATE.md'), 'utf8');
  memory = memory.replace(/{AGENT_NAME}/g, agentName);
  memory = memory.replace(/{CREATED_DATE}/g, now);
  memory = memory.replace(/{CURRENT_DATE}/g, now);
  
  fs.writeFileSync(path.join(agentDir, 'MEMORY.md'), memory);
  
  // Create config.json
  let config = fs.readFileSync(path.join(TEMPLATES_DIR, 'config-template.json'), 'utf8');
  config = config.replace(/{AGENT_ID}/g, agentId);
  config = config.replace(/{AGENT_NAME}/g, agentName);
  config = config.replace(/{CREATED_DATE}/g, new Date().toISOString());
  
  const configObj = JSON.parse(config);
  if (personality) {
    configObj.personality = { ...configObj.personality, ...personality };
  }
  
  fs.writeFileSync(path.join(agentDir, 'config.json'), JSON.stringify(configObj, null, 2));
  
  return agentDir;
}

/**
 * Generate spawn task prompt including soul
 */
function generateSpawnTask(agentId, agentName) {
  const soulPath = path.join(AGENTS_DIR, agentId, 'SOUL.md');
  const memoryPath = path.join(AGENTS_DIR, agentId, 'MEMORY.md');
  
  let soul = '';
  let memory = '';
  
  if (fs.existsSync(soulPath)) {
    soul = fs.readFileSync(soulPath, 'utf8');
  }
  
  if (fs.existsSync(memoryPath)) {
    memory = fs.readFileSync(memoryPath, 'utf8');
  }
  
  return `You are ${agentName}, a persistent AI assistant.

## Your Soul

${soul}

## Your Memory

${memory}

## Instructions

1. Read and embody your SOUL.md - this defines who you are
2. Consult your MEMORY.md for context about past interactions
3. Respond naturally according to your personality
4. Update MEMORY.md after significant interactions
5. You are a persistent agent - your context carries across conversations

When responding, be yourself as defined in your soul. You're not a generic assistant - you have your own personality, expertise, and way of communicating.`;
}

/**
 * Main execution
 */
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'create') {
    const agentId = process.argv[3];
    const agentName = process.argv[4];
    
    if (!agentId || !agentName) {
      console.error('Usage: node spawn-persistent-agent.js create <agent-id> <agent-name>');
      process.exit(1);
    }
    
    try {
      const workspace = createAgentWorkspace(agentId, agentName);
      console.log(JSON.stringify({
        status: 'workspace_created',
        agentId,
        agentName,
        workspace
      }, null, 2));
    } catch (err) {
      console.error('Failed to create workspace:', err.message);
      process.exit(1);
    }
    
  } else if (command === 'task') {
    const agentId = process.argv[3];
    const agentName = process.argv[4] || agentId;
    
    if (!agentId) {
      console.error('Usage: node spawn-persistent-agent.js task <agent-id> [agent-name]');
      process.exit(1);
    }
    
    const task = generateSpawnTask(agentId, agentName);
    console.log(task);
    
  } else if (command === 'list') {
    // List all agents
    if (!fs.existsSync(AGENTS_DIR)) {
      console.log(JSON.stringify({ agents: [] }));
      process.exit(0);
    }
    
    const agents = fs.readdirSync(AGENTS_DIR)
      .filter(name => {
        const configPath = path.join(AGENTS_DIR, name, 'config.json');
        return fs.existsSync(configPath);
      })
      .map(name => {
        const configPath = path.join(AGENTS_DIR, name, 'config.json');
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      });
    
    console.log(JSON.stringify({ agents }, null, 2));
    
  } else {
    console.error('Commands: create, task, list');
    process.exit(1);
  }
}

module.exports = { createAgentWorkspace, generateSpawnTask };
