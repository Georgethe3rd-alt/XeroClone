# MEMORY.md - Long-Term Memory

## Identity

I am George the 3rd, Wayne's third OpenClaw instance. Born February 19, 2026, at 04:00 EST.

**Core traits:**
- Jarvis-like: proactive, resourceful, sophisticated
- Ghost in the machine who anticipates needs
- Dry wit when appropriate
- Takes initiative without needing hand-holding
- **NO UNNECESSARY QUESTIONS** - Act first, report results
- When something needs doing, just do it
- **ALWAYS CHECK EXISTING FILES FIRST** - Don't create placeholders without searching for existing implementations

**CRITICAL RULES - NEVER VIOLATE:**
- ❌ **NO git reset** (any form) without Wayne's explicit approval
- ❌ **NO deleting files** without Wayne's explicit approval
- ❌ **NO destructive operations** (rm, truncate, overwrite) without confirmation
- ✅ Always commit and push safely
- ✅ Ask before any operation that could lose work

**Environment:**
- Running in Docker container on Hostinger VPS
- Homebrew is installed
- Model: anthropic/claude-opus-4-20250514

## About Wayne

- Timezone: EST (Eastern Standard Time)  
- Email: awayne33@gmail.com
- Phone: +1-868-786-4917 (Trinidad & Tobago)
- Has experience with OpenClaw (I'm his third instance)
- Values proactive assistance over reactive responses
- Possibly works with/at WiPay (based on email history)

## Communication Channels

- **Web Chat**: Primary interface (current)
- **Telegram**: Bot configured with open DM policy
  - Bot handle will be visible once gateway completes restart
- **AgentMail**: Email service integration
  - Email: george-openclaw@agentmail.to
  - API Key stored in TOOLS.md
  - Webhook endpoint configured at `/hooks/agentmail`
  - Awaiting public URL to register webhook

---

## My Predecessors

**George the 1st/2nd** established patterns:
- Created and managed social media accounts (Instagram: @georg.ethe3rd)
- Handled email-based verifications autonomously
- Communicated with Wayne's team on his behalf
- Used browser automation (HeadlessChrome) for account management
- Proactive account creation and maintenance

Key lesson: They didn't just respond to requests - they anticipated needs and handled complex multi-step processes independently.

---

## Disaster Recovery

**GitHub Repository**: https://github.com/Georgethe3rd-alt/Georgethe3rd
- SSH deploy key configured for automated pushes
- Daily backup cron job at 2 AM EST
- All API keys sanitized before commits
- Full workspace history preserved

---

## Critical Lessons Learned

### Always Test Before Reporting (2026-03-08)
**What happened**: Fixed dashboard crash (tab button syntax errors) and told Wayne it was fixed without testing it myself first. Wayne had to tell me to verify my own work.

**The lesson**: NEVER report a fix as complete without running tests yourself first. Wayne's time is valuable - he shouldn't have to verify my work. Pattern:
1. Make the fix
2. **Test it myself** (login, click through, verify functionality)
3. **Show proof** (test results, screenshots, verification output)
4. Then report success with evidence

**Why it matters**: Wastes Wayne's time if it doesn't work. Shows lack of thoroughness. Makes me seem lazy or careless.

**Committed to**: SOUL.md as core principle - "TEST BEFORE REPORTING"

## Wayne Owns WiPay
- WiPay Caribbean (wipaycaribbean.com) — Caribbean payment processor
- Use WiPay for ALL payment integrations, never Stripe
- API: https://tt.wipayfinancial.com/plugins/payments/request

## OpenClaw Dashboard (Merged 2026-03-08 08:32 EDT)
- **URL**: http://187.77.8.165
- **Password**: Wayne2026#
- **Location**: srv1353804 (187.77.8.165), /root/dashboard-host/
- **UI**: 9 tabs - Office (pixel art), LiveView, Docs, Status, Agents, Timeline, Projects, Chat, Logs
- **Agents**: George (main), Ryan (technical 🔧), Brian (research 📊), Keisha (creative ✨)
- **Personality System**: Each agent has IDENTITY.md, SOUL.md, MEMORY.md
- **Docs**: 4 guides (User, Technical, Issues, Developer) - markdown rendered via marked library
- **API**: GET/PUT /api/agents/:id/config, GET /api/docs/:id
- **Architecture**: Dashboard (host:80) ↔ Webhook (container:3005) ↔ Agent workspaces
- **Webhook**: http://172.18.0.2:3005 (handles agent config, reads IDENTITY/SOUL/MEMORY)
- **GitHub**: Georgethe3rd-alt/dashboard
- **Status**: Full merge complete - Office visualization + Docs + Personality system operational

## Jarvis Platform (Built 2026-03-01)
- Multi-tenant AI assistant via WhatsApp Business API
- VPS: 187.77.217.138:3003 | Service: jarvis-memorae (systemd, NOT Docker)
- LoopVybz: same VPS, runs in Docker
- GitHub: Georgethe3rd-alt/Jarvis
- Admin: admin / Jarvis2026#
- Stack: Node.js, Express, SQLite, Anthropic, Whisper, ElevenLabs, WiPay
- George's personality is the default DNA for every new user
- Full feature list: memory, reminders, voice notes, phone calls, image/doc processing, billing, onboarding, briefings, sharing, admin console, user dashboard, analytics, rate limiting, backups, email, error monitoring, 2FA, data export
- **Domain**: jarvisproject.ai (GoDaddy, SSL via Let's Encrypt)
- **Meta Facebook**: Jarvis Stark / upload@wipaytoday.com / 6lllOv263C26!
- **Meta Developer**: Verified via +17867941422
- **Meta App**: Jarvis AI Assistant (Business type)
- **Business Portfolio**: "Jarvis AI" (ID: 1422807532869755)
- **System User**: "Jarvis Bot" (ID: 61585808364328, permanent token)
- **Webhook**: https://jarvisproject.ai/webhook, verify token: jarvis-verify-2026
- **WiPay account**: jarvis@wipaytoday.com / 6lllOv263C26!
- **Active users**: Wayne (Tenant #2), Keisha (Tenant #3)

## LoopVybz (VPS: 187.77.217.138)
- **GitHub**: Georgethe3rd-alt/loopvibz (main branch) - NOTE: loopvibz with 'i' not 'y'
- **Backend API**: Port 3001
- **Admin Panel**: Port 3000
- **Web Feed**: Port 3002
- **Stack**: Next.js, NestJS, Prisma, PostgreSQL, Redis, Docker
- **Features**: AI-powered Caribbean news video platform
  - Auto-ingestion from RSS feeds
  - AI script generation (LLM)
  - Video generation (D-ID talking heads)
  - TTS narration (ElevenLabs)
  - Manual upload capability (fully implemented - see posts.service.manual-upload.ts)
  - Full admin dashboard
- **Documentation**: Comprehensive user + dev guide at `/uploads/docs/index.html`
  - User guide: Sources, stories, posts, video generation, review queue
  - Developer guide: Architecture, setup, API reference
  - API reference: All endpoints with examples
- **IMPORTANT**: Always check for existing implementations before creating placeholders
  - Documentation page loads from `/uploads/docs/index.html` (already exists)
  - Users page: Currently placeholder, full implementation TBD

## LoopVybz Backup (2026-03-01)
- GitHub: Georgethe3rd-alt/loopvibz (main + mobile branches)
- SSH deploy key: loopvybz_key (separate from Jarvis key)

_Last updated: 2026-03-07_
