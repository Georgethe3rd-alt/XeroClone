# Network Connectivity Fix - Options

**Problem**: Dashboard (VPS host) cannot reach Webhook Service (Docker container)

Current setup:
- Dashboard: `187.77.217.138:3004` (VPS host)
- Webhook: `172.18.0.2:3001` (Docker internal IP)

## Option A: Expose Container Port (Recommended)

**Pros**:
- Simple and clean
- Webhook stays in container with agent files
- No file synchronization needed

**Cons**:
- Requires OpenClaw container restart (brief downtime)

**Implementation**:
```bash
# 1. Find OpenClaw container
docker ps | grep openclaw

# 2. Stop container
docker stop <container-id>

# 3. Start with port mapping
docker run -d \
  --name openclaw \
  -p 3001:3001 \
  ... (other flags) \
  openclaw-image

# 4. Verify
curl http://localhost:3001/webhook/agent/status
```

**Dashboard config**: Change `WEBHOOK_URL` from `http://172.18.0.2:3001` to `http://localhost:3001`

---

## Option B: Run Webhook on Host

**Pros**:
- No container changes needed
- Works immediately

**Cons**:
- Webhook can't access container filesystem
- Need to mount agent workspaces to host
- More complex setup

**Implementation**:
```bash
# 1. Copy webhook service to host
scp dashboard-webhook.js root@187.77.217.138:/opt/openclaw-webhook/

# 2. Mount agent workspaces (Docker volume or bind mount)
docker volume create openclaw-agents
docker run ... -v openclaw-agents:/data/.openclaw/workspace/agents ...

# 3. Mount same volume to host
mount -t ... /data/agents

# 4. Run webhook on host
cd /opt/openclaw-webhook
node dashboard-webhook.js
```

---

## Option C: Run Dashboard in Container

**Pros**:
- Everything in one place
- Internal Docker networking just works

**Cons**:
- Dashboard less accessible from outside
- Harder to debug
- Loses systemd management

**Implementation**:
```bash
# 1. Add dashboard to OpenClaw container
docker exec -it openclaw bash
cd /opt
git clone https://github.com/Georgethe3rd-alt/dashboard

# 2. Run inside container
cd /opt/dashboard
npm install
PORT=3004 node server.js

# 3. Expose port 3004
docker stop openclaw
docker run ... -p 80:3004 ... openclaw-image
```

---

## Recommendation: Option A

**Expose port 3001 from container to host.**

This is the cleanest solution:
- Webhook stays with agent files
- Dashboard stays on host with systemd
- Simple port mapping solves the problem
- Minimal code changes

**Steps**:
1. Check current OpenClaw container run command
2. Add `-p 3001:3001` to docker run
3. Update dashboard `WEBHOOK_URL` to `http://localhost:3001`
4. Restart both services
5. Test connectivity

**Estimated time**: 5 minutes
**Downtime**: ~30 seconds for container restart

---

## Quick Fix (Temporary)

If you want to test NOW without restarting container:

```bash
# SSH tunnel from host to container
ssh -N -L 3001:172.18.0.2:3001 root@localhost &

# This forwards host:3001 → container:3001
# Dashboard can now use http://localhost:3001
```

This works immediately but won't persist across reboots.

---

*Awaiting decision on approach.*
