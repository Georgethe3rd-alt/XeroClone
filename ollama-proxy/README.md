# Ollama OpenAI Proxy

OpenAI-compatible API wrapper for Ollama, allowing OpenClaw to use local LLMs via the `openai/*` provider.

## Quick Start

**On the VPS host (not in containers):**

```bash
cd /data/.openclaw/workspace/ollama-proxy
./deploy.sh
```

That's it. The proxy will be running at `http://172.17.0.1:11435/v1`

## What Gets Installed

1. **Proxy server**: `/root/dashboard-host/ollama-proxy.js`
2. **Systemd service**: `/etc/systemd/system/ollama-proxy.service`
3. **Logs**: `/var/log/ollama-proxy.log` and `/var/log/ollama-proxy-error.log`

## Testing

```bash
# Quick test
./test-proxy.sh

# Or manually
curl http://localhost:11435/health
curl http://localhost:11435/v1/models
```

## Files

- **ollama-proxy.js** - Main proxy server (Express + Axios)
- **ollama-proxy.service** - Systemd service definition
- **deploy.sh** - Automated deployment script
- **test-proxy.sh** - Testing script
- **DEPLOY.md** - Detailed deployment and configuration guide

## How It Works

```
OpenClaw wants to use "openai/llama3.2:1b"
    ↓
Points to proxy: http://172.17.0.1:11435/v1
    ↓
Proxy translates OpenAI API → Ollama API
    ↓
Ollama runs the model locally (localhost:11434)
    ↓
Proxy returns OpenAI-compatible response
    ↓
OpenClaw gets response (thinks it's OpenAI)
```

## Why Separate Container?

Running in dashboard container (not OpenClaw container) keeps it isolated:
- If proxy crashes, OpenClaw stays up
- Can restart/update proxy without touching OpenClaw
- Clean separation of concerns
- Dashboard already has Node.js + dependencies

## Next Steps After Deployment

See **DEPLOY.md** for:
- Configuring OpenClaw to use the proxy
- Spawning agents with local models
- Troubleshooting common issues
- Cost savings analysis

## Management Commands

```bash
# Status
systemctl status ollama-proxy

# Logs
journalctl -u ollama-proxy -f

# Restart
systemctl restart ollama-proxy

# Stop
systemctl stop ollama-proxy

# Disable
systemctl disable ollama-proxy
```

## Port

Default: **11435** (next to Ollama's 11434)

Change via environment in service file:
```ini
Environment=PORT=<your-port>
```

## Models

Uses whatever models you have in Ollama:

```bash
# List available models
ollama list

# Pull new models
ollama pull llama3.2:1b
ollama pull mistral
ollama pull codellama

# Test specific model
curl -X POST http://localhost:11435/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Requirements

- Ollama installed and running on host
- Node.js (already in dashboard container)
- axios package (already in dashboard node_modules)
- Port 11435 available

## Security

- Listens on all interfaces but only accessible from Docker bridge network
- No authentication (trusted internal network)
- Firewall should block external access to port 11435

## Performance

- **Latency**: ~50-200ms for small models (1-3B params)
- **Throughput**: Depends on your hardware (CPU/GPU)
- **Concurrency**: Express handles multiple requests
- **Memory**: Model stays loaded in Ollama (reused across requests)

## Limitations

- No embeddings endpoint (yet)
- No fine-tuning support
- Usage metrics are zeros (Ollama doesn't provide token counts)
- Streaming support is basic (may have edge cases)

## Troubleshooting

**Proxy won't start:**
```bash
journalctl -u ollama-proxy -n 50
# Check for port conflicts, missing dependencies
```

**OpenClaw can't reach it:**
```bash
# From OpenClaw container
docker exec <container-id> curl http://172.17.0.1:11435/health
# Should return {"status":"ok",...}
```

**Model errors:**
```bash
# Check model is available
ollama list
# Pull if missing
ollama pull llama3.2:1b
```

## Contributing

This is a local tool, but improvements welcome:
- Better error handling
- Streaming improvements
- Embeddings endpoint
- Usage metrics estimation

---

**Status**: Production ready  
**Tested**: With llama3.2:1b on Hostinger VPS  
**Maintained**: George the 3rd (OpenClaw)
