# OpenClaw Command Center

Multi-agent AI dashboard with real-time chat, webhook integration, and comprehensive documentation.

## Features

- **Multi-Agent Support**: Chat with George, Ryan, Brian, and other OpenClaw agents
- **Real-time Communication**: WebSocket-based instant messaging
- **Webhook Integration**: Queue-based architecture for async agent processing
- **Documentation Hub**: Built-in User, Technical, Issues, and Developer guides
- **Modern UI**: Clean, responsive interface with status indicators
- **Session Management**: Persistent agent sessions across restarts

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: Vanilla HTML/CSS/JS (no framework dependencies)
- **Integration**: OpenClaw `sessions_spawn` and `sessions_send` tools
- **Markdown**: `marked` library for documentation rendering
- **Storage**: File-based queue system with JSON persistence

## Quick Start

### Prerequisites

- Node.js v22+
- OpenClaw instance with webhook service running
- Access to OpenClaw workspace directory

### Installation

```bash
npm install
```

### Configuration

Set environment variables:

```bash
export PORT=80                              # Dashboard HTTP port
export WEBHOOK_URL=http://172.18.0.2:3001 # Webhook service URL
export DASH_PASSWORD=Wayne2026#            # Login password
```

### Run

```bash
node server.js
```

Dashboard available at: `http://localhost:80` (or your configured PORT)

## Deployment

### Docker Compose (Recommended)

```bash
docker-compose up -d --build
```

### Systemd

See `dashboard.service` for systemd unit configuration.

### Manual

```bash
node server.js
```

## Documentation

Access the built-in documentation by clicking the **Docs** tab after login:

- **📖 User Guide**: How to use the dashboard
- **⚙️ Technical Docs**: System architecture and integration
- **🐛 Known Issues**: Problems and resolutions
- **💻 Developer Guide**: API reference and development

Or read the markdown files directly in `/docs/`.

## Architecture

```
Dashboard Frontend (Browser)
    ↓ WebSocket
Dashboard Backend (server.js, port 80)
    ↓ HTTP POST
Webhook Service (port 3001)
    ↓ Queue files
George Processor (webhook-queue-processor.js)
    ↓ OpenClaw tools
Subagents (Ryan, Brian, etc.)
    ↓ Callback POST
Dashboard Backend
    ↓ WebSocket broadcast
Frontend updates
```

## API Endpoints

### Authentication
- `POST /api/auth` - Login and receive session token

### Agents
- `GET /api/agents` - List all agents and status
- `GET /api/agents/:id/messages` - Get message history
- `POST /api/agents/:id/spawn` - Manually spawn agent

### Documentation
- `GET /api/docs/:id` - Get rendered HTML docs (user|technical|issues|developer)

### Webhooks
- `POST /webhook/agent-callback` - Receive agent responses

See `docs/developer.md` for complete API reference.

## Agent Configuration

Available agents are configured in `server.js`:

```javascript
const agents = {
  george: { name: 'George', type: 'openclaw', ... },
  ryan: { name: 'Ryan', type: 'openclaw-subagent', ... },
  brian: { name: 'Brian', type: 'openclaw-subagent', ... }
};
```

Add new agents by:
1. Adding to `agents` object in `server.js`
2. Creating workspace directory: `/data/.openclaw/workspace/agents/<name>/`
3. Creating `memory.md` in workspace
4. Updating webhook service `AGENT_WORKSPACES` mapping

## Project Structure

```
dashboard/
├── server.js              # Main backend (webhook-enabled)
├── server-old-telegram.js # Old Telegram API version (deprecated)
├── package.json
├── public/
│   └── index.html         # Frontend SPA
├── docs/
│   ├── user.md
│   ├── technical.md
│   ├── issues.md
│   └── developer.md
├── Dockerfile
├── docker-compose.yml
├── dashboard.service      # Systemd unit file
└── README.md              # This file
```

## Known Issues

See `docs/issues.md` or the **Known Issues** tab in the dashboard for current limitations and workarounds.

## Security

- Password authentication (single shared password)
- Session tokens stored in memory
- WebSocket secured when using HTTPS
- No external data transmission without explicit command

For production deployments, consider:
- Individual user accounts with bcrypt password hashing
- Redis-backed session storage
- Rate limiting on authentication endpoint
- SSL/TLS encryption

See `docs/developer.md` for security best practices.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

## License

[Add your license here]

## Support

- **Documentation**: Built-in Docs tab or `/docs/` directory
- **Issues**: GitHub Issues
- **Contact**: [Your contact info]

## Credits

Built by George the 3rd for OpenClaw Command Center.

Powered by [OpenClaw](https://openclaw.ai).
