# Queue Processor Instructions for George

## How to Process the Dashboard Queue

Every few minutes, or when you notice activity, check for pending requests:

```bash
ls /data/.openclaw/workspace/dashboard-queue/requests/
```

For each request file, process it as follows:

### Step 1: Read the Request

```bash
cat /data/.openclaw/workspace/dashboard-queue/requests/<filename>.json
```

Extract: `requestId`, `agentId`, `message`

### Step 2: Check if Agent Has Active Session

Look in `/data/.openclaw/workspace/dashboard-queue/sessions.json` to see if this agent already has a session.

### Step 3a: If Session Exists - Send to Existing Session

Use `sessions_send`:

```javascript
sessions_send({
  label: "<agentId>-dashboard",  // or use sessionKey
  message: "<message from request>"
})
```

### Step 3b: If No Session - Spawn New Session

Use `sessions_spawn`:

```javascript
sessions_spawn({
  task: "<message from request>",
  label: "<agentId>-dashboard",
  mode: "session",  // IMPORTANT: session, not run
  model: "<agent's model>",
  cwd: "<agent's workspace>",
  timeoutSeconds: 120
})
```

Then save the session key to `sessions.json`:

```json
{
  "<agentId>": {
    "sessionKey": "agent:main:subagent:xxx",
    "label": "<agentId>-dashboard",
    "createdAt": <timestamp>,
    "lastUsed": <timestamp>
  }
}
```

### Step 4: Capture Agent's Response

When the agent responds (auto-announce), write to response file:

```bash
/data/.openclaw/workspace/dashboard-queue/complete-request.sh "<requestId>" "<agent's response>"
```

### Step 5: Clean Up

Move the request file to processing/completed:

```bash
mv /data/.openclaw/workspace/dashboard-queue/requests/<filename>.json \
   /data/.openclaw/workspace/dashboard-queue/processing/
```

## Agent Configuration

```javascript
const agentConfig = {
  scout: { 
    model: 'anthropic/claude-haiku-4-5', 
    workspace: '/data/.openclaw/workspace/agents/heartbeat' 
  },
  ryan: { 
    model: 'anthropic/claude-sonnet-4-5', 
    workspace: '/data/.openclaw/workspace/agents/ryan' 
  },
  brian: { 
    model: 'anthropic/claude-sonnet-4-5', 
    workspace: '/data/.openclaw/workspace/agents/brian' 
  },
  keisha: { 
    model: 'openai/gpt-4.1', 
    workspace: '/data/.openclaw/workspace/agents/keisha' 
  }
};
```

## Session Continuity

- **mode: "session"** keeps the agent alive between messages
- Track session keys in `sessions.json`
- Use `sessions_send` for follow-up messages to the same agent
- Agent maintains full conversation history

## Automation

Later, this can be automated via:
1. Cron job that calls a processing script every 1-5 minutes
2. File watcher that triggers on new request files
3. Heartbeat check that includes queue processing

For now: Manual processing when you see requests.
