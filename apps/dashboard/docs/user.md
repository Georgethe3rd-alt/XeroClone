# User Guide

Welcome to the OpenClaw Command Center! This dashboard gives you direct access to your AI agents powered by OpenClaw.

## Getting Started

### Login

Access the dashboard at `http://187.77.217.138` and enter your password (`Wayne2026#`).

### Interface Overview

The dashboard has two main tabs:

- **Agents**: Chat with your AI assistants
- **Docs**: Read documentation (you're here now!)

## Using Agents

### Available Agents

- **George** - Your primary OpenClaw assistant (always online)
- **Ryan** - Specialized subagent for focused tasks
- **Brian** - Additional subagent for parallel work

### Chatting with an Agent

1. Click on an agent in the left sidebar
2. Type your message in the input box at the bottom
3. Press Enter or click "Send"
4. Watch for the agent's response in the chat area

### Agent Status Indicators

- 🟢 **Online** - Agent is ready and available
- 🟡 **Working** - Agent is processing your request
- 🔵 **Idle** - Agent is online but not actively working
- ⚫ **Offline** - Agent is not available

### Stream Output

When agents are working on complex tasks, you may see streaming output appear in real-time. This shows the agent's thought process and intermediate results.

## Tips & Best Practices

### Be Specific

Agents work best with clear, specific instructions:

❌ "Help me with code"  
✅ "Review this Python function and suggest optimizations for readability"

### Use the Right Agent

- **George**: General assistance, coordination, system tasks
- **Ryan/Brian**: Focused technical work, code review, specific projects

### Check Status

Watch the status indicator to know when an agent is working on your request. Don't send multiple messages while status shows "working" - let the agent complete its task.

## Common Tasks

### Ask Questions

Simply type your question naturally:

> "What's the weather today?"  
> "Summarize the latest emails"  
> "What tasks are pending?"

### Get Help with Code

```
Review this code and fix any bugs:

[paste your code]
```

### Delegate Work

```
Ryan, please refactor the authentication module to use JWT tokens instead of sessions.
```

### Get Updates

> "What have you been working on today?"  
> "Any important notifications?"

## Troubleshooting

### Agent Not Responding

1. Check the status indicator - agent may still be working
2. Refresh the page to reconnect WebSocket
3. Try selecting a different agent and back

### Lost Connection

If you see "Connecting..." in the corner, the dashboard is reconnecting to the server. Wait a few seconds and it should recover automatically.

### Login Issues

Clear your browser's local storage and try logging in again:

1. Open browser developer tools (F12)
2. Go to "Application" or "Storage"
3. Clear local storage for this site
4. Refresh and login again

## Keyboard Shortcuts

- **Enter** - Send message (when input is focused)
- **Esc** - Clear input (when input is focused)

## Privacy & Security

- All conversations stay within your OpenClaw instance
- Password is required for access
- WebSocket connection is secured when using HTTPS
- No data is sent to external services without your explicit command

## Getting More Help

Need assistance? Just ask George in the chat:

> "George, how do I [task]?"

George has access to all system documentation and can guide you through any feature.
