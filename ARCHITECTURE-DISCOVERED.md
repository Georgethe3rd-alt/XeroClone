# Architecture Discovery
**Date**: 2026-03-08 08:02 EDT

## Server Layout

### Server 1 (Current Location)
**Docker Network**: 172.18.0.0/16

**Containers**:
- **OpenClaw** (172.18.0.2) ← I am here
  - Running OpenClaw main instance
  - Webhook service on port 3005
  - Agent workspaces at `/data/.openclaw/workspace/agents/`
  
- **Dashboard** (172.18.0.1)
  - Running a dashboard (old version?)
  - No /api/auth endpoint (different dashboard?)
  - HTTP on port 80
  - Status: Needs updated code deployed

**Gateway**: 172.18.0.1
**Network**: Same Docker bridge network

---

### Server 2 (187.77.217.138)
**External VPS**

**Services**:
- Jarvis Platform (port 3003)
- LoopVybz (ports 3000, 3001, 3002)
- Dashboard (mistakenly deployed here on port 3004)

**Note**: This VPS has the UPDATED dashboard code, but it's the wrong location.

---

## Current Situation

### What I Did (Incorrectly)
1. Built updated dashboard with agent personality system
2. Deployed to Server 2 (187.77.217.138:3004)
3. Created systemd service on Server 2

### What Should Happen
1. Deploy updated dashboard to Server 1 (172.18.0.1)
2. Both OpenClaw and Dashboard on same Docker network
3. Webhook at 172.18.0.2:3005 accessible from Dashboard at 172.18.0.1
4. No network issues - internal Docker communication

---

## Solution

### Option A: Deploy to Dashboard Container Directly
```bash
# Copy updated files to Dashboard container
# (Requires Docker access or shared volume)

# Update server.js
# Update public/index.html
# Set WEBHOOK_URL=http://172.18.0.2:3005
# Restart dashboard service
```

### Option B: Shared Volume
```bash
# If both containers share a volume
# Copy files from OpenClaw workspace to shared volume
# Dashboard reads from shared volume
```

### Option C: HTTP File Transfer
```bash
# Dashboard pulls updated code via HTTP
# OpenClaw serves files temporarily
# Dashboard updates itself
```

---

## Network Test Results

```bash
# From OpenClaw container (172.18.0.2)

curl http://172.18.0.1
# Result: ✅ OpenClaw Command Center HTML

curl http://172.18.0.1/api/auth
# Result: ❌ Cannot POST /api/auth (old/different dashboard)

# Webhook service (this container)
curl http://172.18.0.2:3005/webhook/agent/status
# Result: ✅ {"success":true,"sessions":{}}
```

---

## Next Steps

1. Confirm: How to deploy code to Dashboard container?
   - Docker exec?
   - Shared volume?
   - Git pull inside container?
   - Copy via host?

2. Update Dashboard container with new code

3. Set environment variables:
   ```
   WEBHOOK_URL=http://172.18.0.2:3005
   PORT=80
   DASH_PASSWORD=Wayne2026#
   ```

4. Restart dashboard service

5. Test: curl http://172.18.0.1/api/agents/ryan/config

6. Verify full agent personality system works

---

## Ideal Final Architecture

```
┌─────────────────────────────────────────────────┐
│           Server 1 (Docker Host)                │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Dashboard Container (172.18.0.1:80)     │  │
│  │  - Updated code with personality API     │  │
│  │  - WebSocket for real-time chat          │  │
│  │  - WEBHOOK_URL=http://172.18.0.2:3005   │  │
│  └──────────────────┬───────────────────────┘  │
│                     │ Same Docker Network       │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  OpenClaw Container (172.18.0.2)         │  │
│  │  - George (main instance)                │  │
│  │  - Webhook service (port 3005)           │  │
│  │  - Agent workspaces (Ryan, Brian, etc.)  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ Internal Docker networking (fast, secure)
- ✅ No port mapping needed
- ✅ No public exposure of webhook service
- ✅ Simple configuration
- ✅ Both services on same machine

---

*Awaiting deployment instructions for Dashboard container*
