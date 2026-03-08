#!/bin/bash
# Quick deployment script for Ollama OpenAI Proxy

set -e

echo "=== Ollama OpenAI Proxy Deployment ==="
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "1. Copying proxy script to /root/dashboard-host/..."
mkdir -p /root/dashboard-host
cp "$SCRIPT_DIR/ollama-proxy.js" /root/dashboard-host/ollama-proxy.js
chmod +x /root/dashboard-host/ollama-proxy.js
echo "✓ Proxy script installed"

echo
echo "2. Installing systemd service..."
cp "$SCRIPT_DIR/ollama-proxy.service" /etc/systemd/system/ollama-proxy.service
systemctl daemon-reload
echo "✓ Service file installed"

echo
echo "3. Enabling and starting service..."
systemctl enable ollama-proxy
systemctl restart ollama-proxy
sleep 2
echo "✓ Service started"

echo
echo "4. Checking service status..."
if systemctl is-active --quiet ollama-proxy; then
    echo "✓ Service is running"
else
    echo "✗ Service failed to start"
    echo "Check logs: journalctl -u ollama-proxy -n 50"
    exit 1
fi

echo
echo "5. Testing proxy..."
if curl -s http://localhost:11435/health | grep -q "ok"; then
    echo "✓ Proxy is responding"
else
    echo "✗ Proxy health check failed"
    exit 1
fi

echo
echo "=== Deployment Complete ==="
echo
echo "Proxy endpoint: http://172.17.0.1:11435/v1"
echo "Available models:"
curl -s http://localhost:11435/v1/models | jq -r '.data[].id' 2>/dev/null || echo "(install jq to see models)"
echo
echo "View logs: journalctl -u ollama-proxy -f"
echo "Stop service: systemctl stop ollama-proxy"
echo
echo "Next: Configure OpenClaw to use this proxy (see DEPLOY.md)"
