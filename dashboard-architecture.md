# Dashboard Architecture (Rebuilt 2026-03-07)

## Overview

The dashboard is now a proper multi-agent system using OpenClaw's sub-agent spawning capabilities.

## Components

### 1. Dashboard Service

**Location:** `/root/dashboard-host/` on 187.77.8.165
**Service:** `dashboard.service` (systemd)
**Port:** 80
**Runtime:** Node.js on host (not Docker)

**Why host-based?**
- Direct access to `openclaw` command
- Can spawn sub-agents using `sessions_spawn`
- Access to workspace directories
- No container networking barriers

### 2. Sub-Agents

Each agent is a real OpenClaw session with:
- Own workspace directory
- Persistent memory file
- Session label for communication
- Model preference
- Independent context

**Agent Details:**

| Agent  | Type          | Model             | Workspace                                        | Session Label           |
|--------|---------------|-------------------|--------------------------------------------------|-------------------------|
| George | openclaw      | claude-opus-4-6   | /data/.openclaw/workspace                        | (main session)          |
| Ryan   | coding-agent  | claude-sonnet-4-5 | /data/.openclaw/workspace/agents/ryan            | ryan-dashboard-agent    |
| Brian  | coding-agent  | claude-sonnet-4-5 | /data/.openclaw/workspace/agents/brian           | brian-dashboard-agent   |
| Keisha | assistant     | gpt-4-1           | /data/.openclaw/workspace/agents/keisha          | keisha-dashboard-agent  |

### 3. Memory System

Each agent has a `memory.md` file in their workspace:

```
/data/.openclaw/workspace/agents/
  ├── ryan/
  │   ├── memory.md
  │   └── (workspace files)
  ├── brian/
  │   ├── memory.md
  │   └── (workspace files)
  └── keisha/
      ├── memory.md
      └── (workspace files)
```

**Memory Format:**

```markdown
# Agent's Memory

## Identity
- Name: Ryan
- Type: coding-agent
- Role: Dashboard agent managed by George

## Workspace
/data/.openclaw/workspace/agents/ryan

## Instructions
- I work on tasks assigned by Wayne or George
- I have access to my workspace and memory
- I can search my memory for context
- I maintain continuity across conversations

## Recent Tasks

## 2026-03-07T19:45:00Z
**User**: Can you help me debug this function?

**Ryan**: Sure, let me take a look...
```

### 4. Sub-Agent Lifecycle

**Spawning:**
```javascript
// When first message sent to agent:
await spawnSubAgent('ryan');

// Executes:
openclaw sessions spawn \
  --runtime subagent \
  --mode session \
  --label ryan-dashboard-agent \
  --model claude-sonnet-4-5 \
  --cwd /data/.openclaw/workspace/agents/ryan \
  --task "You are Ryan, a coding-agent agent. Read your memory at /path/to/memory.md" \
  --thread
```

**Communication:**
```javascript
// Send message to agent:
await sendToAgent('ryan', 'Build a login form');

// Executes:
openclaw sessions send \
  --label ryan-dashboard-agent \
  --message "Build a login form" \
  --timeout 120
```

**Memory Logging:**
- Every message automatically logged to agent's `memory.md`
- Timestamp + user message + agent response
- Agent reads memory file on spawn for context

**Session Management:**
- Sessions persist until killed or timeout
- `restart` action: kills session, next message spawns fresh
- `clear` action: empties message history + resets memory file

### 5. WebSocket Protocol

**Client → Server:**

```json
{
  "type": "chat",
  "agentId": "ryan",
  "message": "Hello"
}

{
  "type": "agentAction",
  "agentId": "ryan",
  "action": "restart"
}

{
  "type": "updateModel",
  "agentId": "ryan",
  "model": "claude-opus-4-6"
}

{
  "type": "liveView",
  "url": "http://localhost:3000",
  "agentId": "ryan"
}
```

**Server → Client:**

```json
{
  "type": "init",
  "agents": {
    "ryan": {
      "name": "Ryan",
      "status": "online",
      "sessionKey": "abc-123",
      ...
    }
  }
}

{
  "type": "message",
  "agent": "ryan",
  "message": {
    "role": "assistant",
    "content": "Here's the login form...",
    "ts": 1234567890
  }
}

{
  "type": "status",
  "agent": "ryan",
  "status": "working",
  "task": "Building login form"
}
```

### 6. API Endpoints

**GET /api/agents** - List all agents
**GET /api/models** - List available models
**PUT /api/agents/:id/model** - Update agent model
**GET /api/agents/:id/messages** - Get message history
**GET /api/agents/:id/memory** - Get memory file content

**POST /api/auth** - Authenticate (password: Wayne2026#)

### 7. Deployment

**Start:**
```bash
systemctl start dashboard
```

**Stop:**
```bash
systemctl stop dashboard
```

**Logs:**
```bash
journalctl -u dashboard -f
```

**Restart:**
```bash
systemctl restart dashboard
```

### 8. Differences from Old System

| Feature                  | Old System        | New System          |
|--------------------------|-------------------|---------------------|
| Agent Runtime            | Shell script      | OpenClaw sessions   |
| Memory                   | None              | Persistent files    |
| Context                  | None              | Full history        |
| Communication            | File polling      | Sessions send/recv  |
| Ryan Implementation      | Basic queue       | Real sub-agent      |
| Brian Implementation     | None              | Real sub-agent      |
| Keisha Implementation    | None              | Real sub-agent      |
| Task Delegation          | Manual only       | Wayne or George     |
| Workspace Access         | No                | Yes                 |
| Model Switching          | No effect         | Respawns agent      |

### 9. George's Role

As the main OpenClaw instance (me), I can:
- View all sub-agent status via dashboard
- Delegate tasks to Ryan/Brian/Keisha
- Monitor their memory and progress
- Kill/restart agents as needed
- Coordinate multi-agent work

### 10. Future Enhancements

- [ ] Agent-to-agent communication
- [ ] Shared workspace for collaboration
- [ ] Task queue for load balancing
- [ ] Memory search API
- [ ] Agent performance metrics
- [ ] Automatic respawn on crash
- [ ] Session persistence across dashboard restarts

---

**Last Updated:** 2026-03-07 by George
**Status:** Production
**Version:** 2.0 (Real Sub-Agents)

---

## Update 2026-03-07 15:40 EST - Agent Runtime Configuration

**Current Agent Setup:**

| Agent  | Type        | Runtime   | Model         | Provider   | API Key Needed |
|--------|-------------|-----------|---------------|------------|----------------|
| Ryan   | claude-code | acp       | sonnet-4-5    | Anthropic  | ✓ (configured) |
| Brian  | assistant   | subagent  | gpt-4-1       | OpenAI     | ⚠ (needed)     |
| Keisha | assistant   | subagent  | gpt-4-1       | OpenAI     | ⚠ (needed)     |

**Runtime Behavior:**
- `claude-code` type → spawns with `--runtime acp --agentId claude-code`
- `assistant` type → spawns with `--runtime subagent`

**API Key Configuration:**
- OpenAI API key needs to be added to environment
- Can be set in `/etc/systemd/system/dashboard.service`
- Or via environment variable: `OPENAI_API_KEY=sk-...`

**Future Enhancement:**
- Per-agent API key configuration via UI
- Model selection dropdown in dashboard (already exists in UI)
- Dynamic runtime switching based on model provider

---
**Last Updated:** 2026-03-07 by George
