# OpenClaw Command Center Dashboard

Multi-agent control panel for George (OpenClaw) and Ryan (Claude Code).

## Features
- 🦞 Real-time chat with George via Telegram bridge
- 🤖 Direct chat with Ryan (Claude Code agent)
- 📊 Agent status monitoring (online/working/idle)
- 🔒 Password-protected access
- 💬 Message history and task tracking

## Quick Deploy

```bash
# 1. Build and start
docker-compose up -d --build

# 2. Access dashboard
http://YOUR_SERVER_IP:80

# Default password: Wayne2026#
```

## Configuration

Edit `docker-compose.yml` to change:
- `DASH_PASSWORD` - Dashboard login password
- `TELEGRAM_CHAT_ID` - Your Telegram user ID
- Ports (default: 80)

## Architecture

- **Frontend**: Vanilla JS, WebSocket for real-time updates
- **Backend**: Node.js + Express + WebSocket
- **George**: Messages routed via Telegram Bot API
- **Ryan**: Direct claude-code CLI spawning

## Endpoints

- `GET /` - Dashboard UI
- `POST /api/auth` - Login
- `GET /api/agents` - Agent status
- `WS /ws` - Real-time updates

## Notes

- Dashboard runs independently from OpenClaw gateway
- No shared dependencies with other projects
- Restart-safe: systemd or Docker restart policy
