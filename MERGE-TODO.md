# Dashboard Merge - Outstanding Work

**Status**: Advanced UI deployed, Docs + Personality system pending

## Current State

✅ **Deployed**: Advanced dashboard (/root/dashboard-host/)
- Office tab (pixel art visualization)
- LiveView tab (iframe embed)
- Chat tabs
- Agent management via OpenClaw CLI
- WebSocket real-time

## What Needs to be Merged

### From New Version (Backup at /root/dashboard-host-backup-1772972436/)

#### 1. Documentation System
**UI Changes** (index.html):
- Add "Docs" tab to navigation
- Add docs tab content area
- Add tab switching logic for docs

**Backend Changes** (server.js):
- Add `const { marked } = require('marked')`  
- Add `/api/docs/:id` endpoint (lines 200-217 from backup)
- Serves markdown files from `/root/dashboard-host/docs/`

**Files**:
- `/root/dashboard-host/docs/user.md` ✅ Already copied
- `/root/dashboard-host/docs/technical.md` ✅ Already copied
- `/root/dashboard-host/docs/issues.md` ✅ Already copied
- `/root/dashboard-host/docs/developer.md` ✅ Already copied

#### 2. Agent Personality System
**UI Changes** (index.html):
- Add agent settings/config panel (optional - can be API-only)

**Backend Changes** (server.js):
- Add `const axios = require('axios')` ✅ Already installed
- Add `const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://172.18.0.2:3005'`
- Add `GET /api/agents/:id/config` (lines 219-243 from backup)
- Add `PUT /api/agents/:id/config` (lines 244-261 from backup)
- Add `DELETE /api/agents/:id` (lines 262-280 from backup)

**Integration**:
- Webhook service (already running at 172.18.0.2:3005)
- Agent workspaces (already created: ryan, brian, keisha)
- IDENTITY/SOUL/MEMORY files (already created)

## Implementation Plan

### Option A: Minimal (Docs Only)
1. Add marked library import to server.js
2. Add `/api/docs/:id` endpoint before server.listen
3. Add Docs tab to index.html
4. Test docs loading

**Time**: ~10 minutes
**Result**: Office + LiveView + Docs tabs working

### Option B: Full Merge
1. Do Option A
2. Add axios and WEBHOOK_URL to server.js
3. Add personality API endpoints
4. Test agent config API
5. (Optional) Add UI for personality editing

**Time**: ~20 minutes
**Result**: Full feature set operational

## Quick Fix Commands

### Add Docs Endpoint
```bash
# On server
cd /root/dashboard-host

# Add marked import after line 6
sed -i '6a const { marked } = require('"'"'marked'"'"');' server.js

# Add docs endpoint before server.listen (line 406)
sed -i '406i\
app.get("/api/docs/:id", authCheck, (req, res) => {\
  const docId = req.params.id;\
  const docPath = path.join(__dirname, "docs", `${docId}.md`);\
  if (!fs.existsSync(docPath)) return res.status(404).send("<h1>Not found</h1>");\
  try {\
    const markdown = fs.readFileSync(docPath, "utf8");\
    const html = marked(markdown);\
    res.send(html);\
  } catch (error) {\
    res.status(500).send("<h1>Error loading doc</h1>");\
  }\
});' server.js

systemctl restart dashboard
```

## Files for Reference

- **Backup with personality**: `/root/dashboard-host-backup-1772972436/`
- **Current advanced**: `/root/dashboard-host/`
- **Docs files**: `/root/dashboard-host/docs/` ✅ Present
- **Agent workspaces**: `/data/.openclaw/workspace/agents/` ✅ Created
- **Webhook service**: Running at 172.18.0.2:3005 ✅ Active

---

*Awaiting direction: Minimal (docs only) or Full merge?*
