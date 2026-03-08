# Ollama OpenAI Proxy - Deployment Guide

## What This Does

Creates an OpenAI-compatible API endpoint that forwards requests to local Ollama. This allows OpenClaw to use `openai/llama3.2:1b` (or any Ollama model) by pointing to this proxy.

## Architecture

```
OpenClaw Container (172.18.0.2)
    ↓ HTTP request to 172.17.0.1:11435
Dashboard Container (172.18.0.1) - Ollama Proxy
    ↓ HTTP request to localhost:11434
Host System - Ollama Service
```

## Deployment Steps

### 1. Copy proxy script to dashboard host

```bash
# SSH to VPS
ssh root@187.77.8.165

# Copy the proxy script
cp /path/to/ollama-proxy.js /root/dashboard-host/ollama-proxy.js
chmod +x /root/dashboard-host/ollama-proxy.js
```

### 2. Install as systemd service

```bash
# Copy service file
cp /path/to/ollama-proxy.service /etc/systemd/system/ollama-proxy.service

# Enable and start
systemctl daemon-reload
systemctl enable ollama-proxy
systemctl start ollama-proxy

# Check status
systemctl status ollama-proxy
```

### 3. Test the proxy

```bash
# Health check
curl http://localhost:11435/health

# List models
curl http://localhost:11435/v1/models

# Test completion
curl -X POST http://localhost:11435/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

### 4. Configure OpenClaw to use it

Add to OpenClaw config (`~/.config/openclaw/config.yaml`):

```yaml
models:
  - provider: openai
    apiKey: "dummy-key-not-needed"
    baseUrl: "http://172.17.0.1:11435/v1"
    models:
      - id: "openai/llama3.2:1b"
        name: "Llama 3.2 1B (Local)"
        context: 128000
        tags: ["local", "free"]
```

Then restart OpenClaw:
```bash
docker restart <openclaw-container>
```

### 5. Verify in OpenClaw

```bash
openclaw models list
# Should show: openai/llama3.2:1b with "Local" tag
```

## Usage

In OpenClaw sessions:

```javascript
// Spawn agent with local model
sessions_spawn({
  task: "Check my calendar",
  model: "openai/llama3.2:1b",
  mode: "run"
})
```

## Logs

```bash
# Service logs
journalctl -u ollama-proxy -f

# Or direct log files
tail -f /var/log/ollama-proxy.log
tail -f /var/log/ollama-proxy-error.log
```

## Troubleshooting

**Proxy can't reach Ollama:**
- Check Ollama is running: `systemctl status ollama`
- Test Ollama directly: `curl http://localhost:11434/api/tags`

**OpenClaw can't reach proxy:**
- Check proxy is listening: `netstat -tlnp | grep 11435`
- Verify Docker network: `docker network inspect bridge`
- Test from OpenClaw container: `docker exec <container> curl http://172.17.0.1:11435/health`

**Model not found:**
- Pull model in Ollama: `ollama pull llama3.2:1b`
- Verify: `ollama list`

## Security Notes

- Proxy listens on all interfaces (0.0.0.0) but should only be accessible from Docker bridge
- No authentication required (trusted internal network)
- API key in OpenClaw config is ignored (can be dummy value)

## Cost Savings

- **Anthropic Claude**: ~$15 per million tokens
- **Local Ollama**: $0 (just electricity)
- Ideal for: heartbeats, simple checks, routine tasks, testing
- Not ideal for: complex reasoning, long context, nuanced writing
