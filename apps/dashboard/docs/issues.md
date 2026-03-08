# Known Issues & Resolutions

This document tracks known limitations, resolved issues, and workarounds for the OpenClaw Dashboard system.

## Current Known Issues

### 1. Inter-Agent Message Routing

**Issue**: When George uses `sessions_send` to communicate with subagents (Ryan, Brian, etc.), the responses appear as inter-session messages in Wayne's Telegram chat.

**Example**:
```
[Inter-session message] sourceSession=agent:main:subagent:...
Confirmed. Test message received...
```

**Impact**: Low - Wayne may see these system messages in his personal chat, but dashboard users never see them.

**Root Cause**: OpenClaw's subagent system auto-announces responses to the requester session when using `sessions_send`.

**Status**: ⚠️ Documented limitation, not a blocker

**Workaround**: None needed - this is expected behavior. All user-facing responses are correctly delivered via the callback mechanism to the dashboard.

---

### 2. Agent Session Persistence

**Issue**: Agents spawned with `mode="run"` are one-shot and terminate after responding. Cannot use `mode="session"` with `thread=true`.

**Error Message**: 
```
"thread=true is unavailable because no channel plugin registered subagent_spawning hooks."
```

**Impact**: Medium - Agents need to be re-spawned for each message, adding slight latency.

**Workaround**: Session keys are persisted in `agent-sessions.json`, so subsequent messages reuse the same agent configuration. The system automatically handles re-spawning when needed.

**Status**: ⚠️ Known limitation of current OpenClaw configuration

---

## Resolved Issues

### ✅ Dashboard Webhook Integration

**Issue**: Dashboard was using direct Telegram API and `claude` CLI for agent communication.

**Resolution**: 
- Created webhook service (`dashboard-webhook.js`) on port 3001
- Implemented queue-based architecture for async processing
- Updated dashboard server to use webhook integration
- Created callback endpoint for receiving agent responses

**Date Resolved**: 2026-03-08  
**Resolution By**: George the 3rd

**Files Modified**:
- Created `server-webhook.js` (new dashboard backend)
- Created `dashboard-webhook.js` (webhook service)
- Created `webhook-queue-processor.js` (queue handler)

---

### ✅ Agent Spawning

**Issue**: No mechanism to spawn and manage multiple AI agents.

**Resolution**:
- Implemented `sessions_spawn` integration
- Created agent workspace directories
- Built session key persistence system
- Added automatic session recovery

**Testing**: Successfully spawned and tested `testbot` and `ryan` agents.

**Date Resolved**: 2026-03-08

---

### ✅ Message Queue Processing

**Issue**: No automated processing of webhook requests.

**Resolution**:
- Created queue processor script
- Implemented file-based queue system
- Built validation and error handling
- Documented manual and automated processing options

**Files Created**:
- `webhook-queue-processor.js`
- `process-queue.sh`
- `test-webhook-integration.sh`

**Date Resolved**: 2026-03-08

---

## Future Improvements

### Persistent Thread-Bound Agents

**Current**: Agents spawn in one-shot mode  
**Desired**: Long-running persistent agents with conversation context  
**Blocker**: Requires channel plugin with subagent_spawning hooks

**Potential Solution**: Configure Telegram or Discord channel plugin to support thread-bound subagents.

---

### Automated Queue Processing

**Current**: Manual processing via script  
**Desired**: Automatic processing every 30-60 seconds  

**Implementation Plan**:
```bash
openclaw cron add "*/1 * * * *" "Process webhook queue" \
  "node /data/.openclaw/workspace/webhook-queue-processor.js"
```

---

### Multi-User Authentication

**Current**: Single password for all users  
**Desired**: Individual user accounts with role-based access

**Requirements**:
- User registration system
- Session management
- Role-based permissions (admin, user, viewer)
- Audit logging

---

## Debugging & Diagnostics

### Check Webhook Service Status

```bash
ps aux | grep dashboard-webhook
```

Expected output: Process running on port 3001

### View Queue Contents

```bash
ls -la /data/.openclaw/workspace/webhook-queue/
```

### Check Active Sessions

```bash
cat /data/.openclaw/workspace/agent-sessions.json
```

### Test Webhook Connectivity

```bash
curl http://172.18.0.2:3001/webhook/agent/status
```

### View Dashboard Logs

```bash
# If running via systemd
journalctl -u dashboard -f

# If running via Docker
docker logs openclaw-dashboard -f
```

---

## Reporting Issues

Found a new issue? Here's how to report it:

1. **Check this document** to see if it's already known
2. **Ask George** - he has full system access and can diagnose
3. **Document the issue**:
   - What you were trying to do
   - What happened instead
   - Any error messages
   - Steps to reproduce

George will investigate and update this documentation with findings and resolutions.

---

## Testing Checklist

Before deploying changes, verify:

- [ ] Webhook service is running (port 3001)
- [ ] Dashboard accessible on port 80
- [ ] Can login with correct password
- [ ] Agents appear in sidebar
- [ ] Can send message to agent
- [ ] Agent responds in chat
- [ ] Documentation tabs load correctly
- [ ] WebSocket connection stable

---

*Last updated: 2026-03-08 07:01 EDT*  
*Maintained by: George the 3rd*
