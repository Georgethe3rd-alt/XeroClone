#!/bin/bash
# Deploy Updated Dashboard to Dashboard Container
# Run this from OpenClaw container or host with Docker access

set -e

echo "=== Dashboard Deployment to Container ==="

# Configuration
DASHBOARD_CONTAINER="dashboard"  # or container ID
DASHBOARD_DIR="/app"  # or wherever dashboard code lives in container
PACKAGE="/tmp/dashboard-complete.tar.gz"

# Check if package exists
if [ ! -f "$PACKAGE" ]; then
  echo "Error: Package not found at $PACKAGE"
  echo "Creating package now..."
  cd /data/.openclaw/workspace/apps/dashboard
  tar czf $PACKAGE server.js public/ docs/ package.json package-lock.json
  echo "✓ Package created"
fi

echo "Package ready: $(ls -lh $PACKAGE | awk '{print $5}')"

# Method 1: Docker cp (if running from host with Docker access)
if command -v docker &> /dev/null; then
  echo ""
  echo "Deploying via Docker cp..."
  
  # Copy package to container
  docker cp $PACKAGE ${DASHBOARD_CONTAINER}:/tmp/
  
  # Extract in container
  docker exec $DASHBOARD_CONTAINER bash -c "
    cd $DASHBOARD_DIR && \
    tar xzf /tmp/dashboard-complete.tar.gz && \
    npm install --omit=dev && \
    echo '✓ Files extracted and dependencies installed'
  "
  
  # Set environment variables
  docker exec $DASHBOARD_CONTAINER bash -c "
    export WEBHOOK_URL='http://172.18.0.2:3005'
    export PORT=80
    export DASH_PASSWORD='Wayne2026#'
    echo '✓ Environment configured'
  "
  
  # Restart dashboard service
  echo ""
  echo "Restarting dashboard..."
  docker restart $DASHBOARD_CONTAINER
  
  sleep 3
  
  echo ""
  echo "Testing deployment..."
  curl -s http://172.18.0.1 | grep -q "OpenClaw Command Center" && echo "✓ Dashboard accessible"
  curl -s -X POST http://172.18.0.1/api/auth \
    -H "Content-Type: application/json" \
    -d '{"password":"Wayne2026#"}' | grep -q token && echo "✓ Auth API working"
  
  echo ""
  echo "=== Deployment Complete ==="
  exit 0
fi

# Method 2: If running from OpenClaw container (no Docker access)
echo ""
echo "No Docker access detected."
echo "Manual deployment required:"
echo ""
echo "1. Copy package to Dashboard container:"
echo "   docker cp $PACKAGE ${DASHBOARD_CONTAINER}:/tmp/"
echo ""
echo "2. Extract in Dashboard container:"
echo "   docker exec $DASHBOARD_CONTAINER bash -c 'cd $DASHBOARD_DIR && tar xzf /tmp/dashboard-complete.tar.gz'"
echo ""
echo "3. Install dependencies:"
echo "   docker exec $DASHBOARD_CONTAINER bash -c 'cd $DASHBOARD_DIR && npm install --omit=dev'"
echo ""
echo "4. Set environment variables:"
echo "   docker exec $DASHBOARD_CONTAINER bash -c 'export WEBHOOK_URL=http://172.18.0.2:3005'"
echo ""
echo "5. Restart container:"
echo "   docker restart $DASHBOARD_CONTAINER"
echo ""
