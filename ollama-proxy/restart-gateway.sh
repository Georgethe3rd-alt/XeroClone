#!/bin/bash
# Safe gateway restart with rollback capability

set -e

BACKUP_FILE=~/.openclaw/openclaw.json.backup-20260308-095837

echo "=== OpenClaw Gateway Restart ==="
echo
echo "Config backup: $BACKUP_FILE"
echo "Current config: ~/.openclaw/openclaw.json"
echo

read -p "Restart gateway now? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo "Restarting gateway..."
openclaw gateway restart

echo
echo "Waiting 15 seconds for startup..."
sleep 15

echo
echo "Checking if models include Ollama..."
if openclaw models list | grep -q "Llama 3.2 1B Local"; then
    echo "✅ SUCCESS - Ollama model registered!"
    echo
    echo "Available: ollama-local/llama3.2:1b"
    echo
    echo "Test spawn:"
    echo 'sessions_spawn({task:"Say hello", model:"ollama-local/llama3.2:1b", mode:"run"})'
else
    echo "⚠️ Model not found. Check gateway logs:"
    echo "openclaw gateway logs"
    echo
    echo "To rollback:"
    echo "cp $BACKUP_FILE ~/.openclaw/openclaw.json"
    echo "openclaw gateway restart"
fi
