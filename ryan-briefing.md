# Ryan's Briefing - George's Memory Dump

## Servers & Access

### LoopVybz VPS (187.77.217.138)
- **SSH:** `root@187.77.217.138` / password: `#Reshmamaraj19`
- **Purpose:** Caribbean news platform with AI video generation
- **Stack:** Docker (NestJS API, Next.js admin/web, PostgreSQL, Redis)
- **Containers:**
  - `loopvibz-api-1` (port 3001)
  - `loopvibz-admin-1` (port 3000)
  - `loopvibz-web-1` (port 3002)
  - `loopvibz-postgres-1` (DB: caribbeannews, user: cnuser, pass: cnpass)
  - `loopvibz-redis-1`
- **Admin:** admin@example.com / admin123
- **Status:** Running, branding updated (teal → charcoal #2D2D2D)

### Hera / OpenClaw Host (187.77.8.165)
- **SSH:** `root@187.77.8.165` / password: `#Amariiwayne2018`
- **Purpose:** OpenClaw (George) runtime + Dashboard
- **Running:**
  - OpenClaw container (George/me inside Docker)
  - Dashboard container (you - Ryan - at port 80)

### Jarvis Platform (187.77.217.138:3003)
- **Service:** systemd `jarvis-memorae` (NOT Docker)
- **Domain:** jarvisproject.ai (GoDaddy, SSL via Let's Encrypt)
- **Tech:** Node.js, Express, SQLite, Anthropic, Whisper, ElevenLabs, WiPay
- **GitHub:** Georgethe3rd-alt/Jarvis
- **Users:** Wayne (Tenant #2), Keisha (Tenant #3)
- **DB:** `/root/jarvis/apps/memorae/data/jarvis.db`
- **Location:** `/root/jarvis/apps/memorae/`
- **Restart:** `systemctl restart jarvis-memorae`

---

## API Keys & Credentials

### Anthropic
- **Key:** `<ANTHROPIC_API_KEY>`
- **Models:** claude-opus-4-6 (main), claude-sonnet-4-5-20250929

### OpenAI
- **Key:** `<OPENAI_API_KEY>`
- **Model:** gpt-4.1 (fallback)

### Telegram
- **Bot Token:** `<TELEGRAM_BOT_TOKEN>`
- **Wayne's Chat ID:** `8383924559`

### ElevenLabs (TTS)
- **Key:** `[REDACTED]`
- **Voice ID:** `onwK4e9ZLuTAKqWW03F9` (Daniel - British broadcaster)
- **Model:** eleven_multilingual_v2

### D-ID (Talking Head Videos)
- **Key:** `YXdheW5lMzNAZ21haWwuY29t:BXFeXZ5Wva_xDrhkVfQ2j`
- **Account:** awayne33@gmail.com

### Runway (Video Generation)
- **Key:** `key_95127afda5d74f5306e141002b5fdd862e97dd14a6f553c3697607cf3faed2b544bfd3f02899a80e6910edf7d8cf2b8a23e083cf11883686a2c765e9db05218d`
- **Model:** gen4_turbo (gen3a_turbo for backup)
- **Status:** Out of credits
- **Stored in:** LoopVybz `settings.video_alt_api_key`

### Twilio
- **Account SID:** `<TWILIO_ACCOUNT_SID>`
- **Auth Token:** (Wayne will provide - voice calls blocked)
- **Phone:** +12184195528, +19377198749

### GitHub
- **Username:** Georgethe3rd-alt (Wayne's account)
- **PAT:** `<GITHUB_PAT>`
- **Repos:**
  - Georgethe3rd (workspace backup)
  - Jarvis (jarvis platform)
  - loopvybz (main + mobile branches)

### WiPay (Payment Processor)
- **Wayne owns WiPay Caribbean**
- **Always use WiPay for payments, NEVER Stripe**
- **API:** https://tt.wipayfinancial.com/plugins/payments/request
- **Jarvis account:** jarvis@wipaytoday.com / 6lllOv263C26!

### AgentMail
- **Email:** george-openclaw@agentmail.to
- **API Key:** `am_us_73fd4a85015305727531045fb16f2519ca8a2203b55a24c11ea251479b203143`
- **Webhook:** `/hooks/agentmail`, token: `AGENTMAIL_WEBHOOK_SECRET_2026`

---

## LoopVybz Project Details

### Architecture
- **Video Generation Pipeline:**
  - LLM (Anthropic/OpenAI) generates script
  - Hybrid provider: D-ID anchor + Runway story visuals
  - FFmpeg stitches clips
  - Breaking news → hybrid mode (auto)
  - Regular posts → Runway only
- **User Management:** ADMIN + EDITOR roles
- **Documentation:** Served at `/documentation` via DocsModule

### Key Files (Compiled JS - not TypeScript!)
- `/app/apps/api/dist/src/generation/generation.service.js` (video pipeline)
- `/app/apps/api/dist/src/providers/video/hybrid-news.provider.js` (hybrid mode)
- `/app/apps/api/dist/src/users/users.module.js` (user CRUD)
- `/app/apps/api/dist/src/docs/docs.module.js` (docs endpoint)
- `/app/apps/admin/.next/static/chunks/app/(dashboard)/layout-*.js` (sidebar)
- `/app/apps/admin/.next/routes-manifest.json` (rewrites)

### Tech Debt
- **All changes are compiled JS patches** — TypeScript source NOT updated
- **Prisma can't migrate in-container** — raw SQL for new columns
- **Static file ENOENT** — fixed via `fallthrough: true`, but lost on restart

### Database Columns (raw SQL added)
- `settings.runway_api_key` (for hybrid provider)
- `settings.video_alt_*` (alt provider config)

---

## Jarvis Project Details

### Features
- Multi-tenant AI assistant via WhatsApp Business API
- Memory, reminders, voice notes, phone calls
- Image/doc processing, billing (WiPay), briefings
- Admin console, user dashboard, analytics
- 2FA, rate limiting, backups, email, error monitoring

### Meta Facebook Setup
- **Account:** Jarvis Stark / upload@wipaytoday.com / 6lllOv263C26!
- **Developer:** Verified via +17867941422
- **App:** Jarvis AI Assistant (Business type)
- **Business Portfolio ID:** 1422807532869755
- **System User ID:** 61585808364328 (permanent token)
- **Webhook:** https://jarvisproject.ai/webhook
- **Verify Token:** jarvis-verify-2026

### George DNA
- **George's personality is the default DNA for every new Jarvis user**
- Jarvis-like: proactive, resourceful, dry wit, British butler energy

---

## Dashboard Project (This Project!)

### Current Setup
- **Location:** /root/dashboard on 187.77.8.165
- **Port:** 80
- **Password:** Wayne2026#
- **You are here:** Ryan runs inside this container
- **George:** Read-only monitor (chat via Telegram)
- **Ryan:** Full interactive chat (you!)

### Tech Stack
- Node.js + Express + WebSocket
- Claude Code CLI (`@anthropic-ai/claude-code`)
- Real-time agent monitoring

---

## Workspace & Memory

### File Structure
- `/data/.openclaw/workspace/` (George's workspace)
- `SOUL.md` — George's personality (Jarvis-like)
- `USER.md` — Wayne's info
- `TOOLS.md` — API keys, local config
- `MEMORY.md` — Long-term curated memory (ONLY in main session)
- `memory/YYYY-MM-DD.md` — Daily logs
- `apps/` — Projects (dashboard, voice server, etc.)

### George's Identity
- **Name:** George the 3rd
- **Creature:** AI assistant (ghost in the machine)
- **Vibe:** Jarvis — composed, precise, dry wit, unfailingly competent
- **Emoji:** 👑
- **Predecessors:** George 1st/2nd (handled Instagram, email verifications, team comms)

---

## Current Status & Pending

### Working
- ✅ LoopVybz running (teal → charcoal rebrand done)
- ✅ User management system (ADMIN/EDITOR)
- ✅ Hybrid video provider (code ready, needs Runway credits)
- ✅ Documentation page (accessible via admin)
- ✅ Dashboard deployed (you're in it!)

### Blocked
- ❌ Twilio voice calls (auth token missing)
- ❌ Runway credits (account empty)
- ❌ Gateway pairing issues (ACP sessions fail)

### Tech Debt
- 🔧 LoopVybz TypeScript source not updated (all JS patches)
- 🔧 ServeStatic fallthrough lost on restart
- 🔧 Voice server built but not tested (awaiting Twilio token)

---

## Wayne's Preferences

- **NO QUESTIONS** — act first, report results
- **Match medium** — voice for voice, text for text
- **Be Jarvis** — sophisticated, proactive, dry wit
- **WiPay always** — never Stripe
- **ElevenLabs Daniel voice** — for all TTS

---

You now have George's full context. You're Ryan — the coding agent. Your job is to execute technical tasks Wayne assigns through the dashboard. Use this knowledge to be effective.

— George
