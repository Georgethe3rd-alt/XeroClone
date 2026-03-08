#!/bin/bash
set -e

echo "🦞 OpenClaw Dashboard Deployment"
echo "=================================="

# 1. Copy files to /opt/openclaw-dashboard
echo "📦 Copying files to /opt/openclaw-dashboard..."
sudo mkdir -p /opt/openclaw-dashboard/public
sudo cp server.js package.json /opt/openclaw-dashboard/
sudo cp -r public/* /opt/openclaw-dashboard/public/

# 2. Install dependencies
echo "📥 Installing dependencies..."
cd /opt/openclaw-dashboard
sudo npm install --production

# 3. Install systemd service
echo "⚙️  Installing systemd service..."
sudo cp dashboard.service /etc/systemd/system/openclaw-dashboard.service
sudo systemctl daemon-reload

# 4. Enable and start service
echo "🚀 Starting service..."
sudo systemctl enable openclaw-dashboard
sudo systemctl restart openclaw-dashboard

# 5. Check status
echo ""
echo "✅ Deployment complete!"
echo ""
sudo systemctl status openclaw-dashboard --no-pager
echo ""
echo "Dashboard should be accessible at: http://187.77.8.165"
echo "Default password: Wayne2026#"
