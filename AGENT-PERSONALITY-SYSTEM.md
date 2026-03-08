# Agent Personality System

**Implemented**: 2026-03-08 07:50 EDT

## Overview

Each agent (Ryan, Brian, Keisha, etc.) now has a persistent identity with:

- **SOUL.md**: Personality definition (who they are)
- **MEMORY.md**: Long-term memory (what they remember)
- **config.json**: Configuration metadata

Agents remain spawned until explicitly deleted and maintain conversation context across restarts.

## Architecture

```
/data/.openclaw/workspace/agents/
├── ryan/
│   ├── SOUL.md          # Personality & traits
│   ├── MEMORY.md        # Long-term memory
│   └── config.json      # Configuration
├── brian/
│   ├── SOUL.md
│   ├── MEMORY.md
│   └── config.json
└── keisha/
    ├── SOUL.md
    ├── MEMORY.md
    └── config.json
```

## Creating an Agent

### Command Line

```bash
node /data/.openclaw/workspace/spawn-persistent-agent.js create <agent-id> <agent-name>
```

Example:
```bash
node /data/.openclaw/workspace/spawn-persistent-agent.js create ryan Ryan
```

This creates:
1. Agent workspace directory
2. SOUL.md from template
3. MEMORY.md from template
4. config.json with default personality

### Customizing Personality

Edit the agent's `SOUL.md` file directly or use the API (see below).

## Dashboard API

### Get Agent Configuration

```bash
GET /api/agents/:id/config
Authorization: Bearer TOKEN
```

Returns:
```json
{
  "agentId": "ryan",
  "name": "Ryan",
  "type": "subagent",
  "personality": {
    "primaryTrait": "Helpful and focused",
    "communicationStyle": "Clear and professional",
    "formalityLevel": "balanced",
    "verbosity": "concise",
    "humor": "occasional",
    "expertise": "General assistance"
  }
}
```

### Update Agent Personality

```bash
PUT /api/agents/:id/config
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "personality": {
    "primaryTrait": "Analytical and detail-oriented",
    "communicationStyle": "Technical and precise",
    "expertise": "Code review and debugging"
  }
}
```

This updates both `config.json` and `SOUL.md`.

### View Agent Soul

```bash
GET /api/agents/:id/soul
Authorization: Bearer TOKEN
```

Returns the raw SOUL.md markdown content.

### View Agent Memory

```bash
GET /api/agents/:id/memory
Authorization: Bearer TOKEN
```

Returns the raw MEMORY.md markdown content.

### Delete Agent

```bash
DELETE /api/agents/:id
Authorization: Bearer TOKEN
```

Deletes the entire agent workspace (SOUL, MEMORY, config).

## Personality Parameters

### primaryTrait
Examples:
- "Helpful and focused"
- "Analytical and detail-oriented"
- "Creative and innovative"
- "Methodical and thorough"

### communicationStyle
Examples:
- "Clear and professional"
- "Technical and precise"
- "Casual and friendly"
- "Formal and structured"

### formalityLevel
Options: `balanced`, `formal`, `casual`

### verbosity
Options: `concise`, `moderate`, `detailed`

### humor
Options: `none`, `occasional`, `frequent`

### expertise
Examples:
- "General assistance"
- "Code review and debugging"
- "Research and analysis"
- "Project management"

## Spawning with Personality

When spawning an agent, the system:

1. Reads the agent's SOUL.md
2. Reads the agent's MEMORY.md
3. Includes both in the spawn prompt
4. Agent embodies the personality defined in SOUL

Example spawn prompt structure:
```
You are Ryan, a persistent AI assistant.

## Your Soul
[Contents of SOUL.md]

## Your Memory
[Contents of MEMORY.md]

## Instructions
1. Read and embody your SOUL.md
2. Consult your MEMORY.md for context
3. Respond according to your personality
4. Update MEMORY.md after significant interactions
```

## Examples

### Create Ryan with Technical Personality

```bash
# 1. Create workspace
node spawn-persistent-agent.js create ryan Ryan

# 2. Update personality
curl -X PUT http://187.77.217.138/api/agents/ryan/config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personality": {
      "primaryTrait": "Technical and analytical",
      "communicationStyle": "Precise and methodical",
      "expertise": "Software architecture and debugging",
      "verbosity": "detailed",
      "humor": "none"
    }
  }'

# 3. Spawn agent (via dashboard or webhook)
```

### Create Keisha with Creative Personality

```bash
# 1. Create workspace
node spawn-persistent-agent.js create keisha Keisha

# 2. Update personality
curl -X PUT http://187.77.217.138/api/agents/keisha/config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personality": {
      "primaryTrait": "Creative and innovative",
      "communicationStyle": "Enthusiastic and inspirational",
      "expertise": "Marketing and content creation",
      "verbosity": "moderate",
      "humor": "frequent"
    }
  }'
```

## Agent Lifecycle

### 1. Created
- Workspace exists with SOUL and MEMORY
- Not yet spawned in OpenClaw
- Status: `idle`

### 2. Spawned
- Active OpenClaw session running
- Reads SOUL and MEMORY on spawn
- Maintains conversation context
- Status: `online` or `working`

### 3. Persistent
- Session persists across dashboard restarts
- Session key stored in `agent-sessions.json`
- Memory accumulates over time

### 4. Deleted
- Workspace removed
- Session terminated
- Agent must be recreated from scratch

## Memory Management

Agents update their MEMORY.md automatically based on:
- Significant conversations
- Learned preferences
- Important decisions
- Project context

You can also manually edit MEMORY.md to:
- Add background context
- Document ongoing projects
- Set user preferences
- Note important details

## Best Practices

### 1. Define Clear Personalities
Give each agent a distinct role and expertise:
- Ryan: Technical/analytical
- Brian: Research/planning
- Keisha: Creative/marketing

### 2. Update Memory Regularly
After major conversations, check agent MEMORY.md and add important context.

### 3. Use Appropriate Traits
Match personality to use case:
- Debugging? → Technical, precise, detailed
- Marketing? → Creative, enthusiastic, moderate verbosity
- Support? → Friendly, helpful, concise

### 4. Monitor Status
Check agent status via dashboard or API to know when they're active.

## Troubleshooting

### Agent not embodying personality
- Verify SOUL.md was updated correctly
- Check spawn prompt includes SOUL content
- Re-spawn agent to load new personality

### Memory not persisting
- Verify MEMORY.md file exists in agent workspace
- Check file permissions
- Agent must be spawned with persistent session mode

### Can't update George
- George is the main OpenClaw instance
- His personality is defined in workspace SOUL.md (not agent-specific)
- Cannot be deleted or reconfigured via dashboard

## Future Enhancements

### Planned
- [ ] Dashboard UI for personality editor
- [ ] Visual memory viewer
- [ ] Agent templates library
- [ ] Personality presets
- [ ] Memory export/import

### Ideas
- Agent personality evolution based on interactions
- Collaborative memory sharing between agents
- Personality A/B testing
- Custom trait definitions

---

*Last updated: 2026-03-08 07:50 EDT*  
*Implemented by: George the 3rd*
