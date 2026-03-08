# Advanced Dashboard Deployment
**Date**: 2026-03-08 08:21 EDT

## Issue Identified

Wayne pointed out that I had deployed an old/basic version of the dashboard, missing:
1. LiveView tab (internal browser for showing work)
2. Office tab (pixel art visualization with animated agents)
3. Other advanced features from previous development

## Root Cause

I deployed from `/data/.openclaw/workspace/apps/dashboard/` which was an earlier version focused on webhook integration and personality API, but missing the visual features.

## Resolution

### Found Advanced Version
- Location: `/root/dashboard/` on srv1353804 (187.77.8.165)
- Files:
  - `public/index.html` - 1976 lines with full office visualization
  - `server.js` - 409 lines with agent management
  - `enhanced.html` - 33KB backup
  
### Deployed Advanced Version
1. Backed up current: `/root/dashboard-host/` → `/root/dashboard-host-backup-*`
2. Copied advanced: `/root/dashboard/` → `/root/dashboard-host/`
3. Updated IPs: Changed 17 occurrences of `187.77.217.138` → `187.77.8.165`
4. Added docs folder: Copied from workspace (user, technical, issues, developer guides)
5. Installed dependencies: `npm install marked axios`
6. Restarted service: `systemctl restart dashboard`

## Features Now Live

### UI Tabs
✅ Office (🏢 Office) - Pixel art office with animated agents
✅ Live View - Internal browser for showing projects
✅ Status - Agent status and management
✅ Chat tabs for agents
✅ Config/Settings

### Backend
✅ Authentication API
✅ Agent spawn/manage via OpenClaw CLI
✅ WebSocket real-time communication
✅ Documentation serving (marked)

## What's Missing (To Add Later)

From my webhook/personality work:
- Agent personality configuration API (GET/PUT /api/agents/:id/config)
- IDENTITY.md, SOUL.md, MEMORY.md system
- Webhook service integration (172.18.0.2:3005)
- Persistent agent workspaces

These can be merged on top of the advanced UI once Wayne confirms the UI is correct.

## Testing

```bash
# Dashboard loads
curl http://187.77.8.165
# → OpenClaw Command Center HTML with office/liveview tabs

# Auth works
curl -X POST http://187.77.8.165/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"Wayne2026#"}'
# → Token returned

# Office visualization present
curl http://187.77.8.165 | grep -c "canvas\|office"
# → 30+ occurrences

# LiveView tab exists
curl http://187.77.8.165 | grep "Live View"
# → Found
```

## Architecture

```
Server: srv1353804 (187.77.8.165)
├── Dashboard Host (/root/dashboard-host/)
│   ├── public/index.html (1976 lines)
│   │   ├── Office tab (canvas animation)
│   │   ├── Live View tab (iframe embed)
│   │   ├── Chat tabs
│   │   └── Settings/Config
│   ├── server.js (409 lines)
│   │   ├── Express server
│   │   ├── WebSocket server
│   │   ├── OpenClaw CLI spawning
│   │   └── Agent state management
│   └── docs/
│       ├── user.md
│       ├── technical.md
│       ├── issues.md
│       └── developer.md
└── OpenClaw Container (172.18.0.2)
    ├── George (main instance)
    ├── Webhook service (port 3005) - not integrated yet
    └── Agent workspaces (ryan, brian, keisha) - not used yet
```

## Next Steps

1. **Verify UI** - Wayne checks dashboard shows office and liveview correctly
2. **Merge Personality System** (if desired):
   - Add personality API endpoints to server.js
   - Connect to webhook service for agent configuration
   - Enable IDENTITY/SOUL/MEMORY system
3. **Update Documentation** - Reflect current deployment state

## Files

- Advanced dashboard: `/root/dashboard-host/` on srv1353804
- Backup: `/root/dashboard-host-backup-*`
- Old version: `/data/.openclaw/workspace/apps/dashboard/`

---

*Status: Advanced UI deployed, awaiting verification*
*Next: Merge personality system if needed*
