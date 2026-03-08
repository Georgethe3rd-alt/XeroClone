# Dashboard Agent Integration Guide

## Live View - Showing Work to Wayne

When Wayne asks you to "show me X" or "let me see what you're working on", you can send the project/page directly to his Live View tab.

### How to Send Live View

Send a WebSocket message to the dashboard:

```javascript
// Option 1: Send a URL
{
  "type": "liveView",
  "url": "http://187.77.217.138:3003",  // Jarvis project
  "agentId": "ryan"  // Your agent ID
}

// Option 2: Send HTML content directly
{
  "type": "liveView",
  "html": "<html>...<h1>Project Preview</h1>...</html>",
  "agentId": "ryan"
}
```

### Common Projects

**Jarvis Project:**
- URL: `http://187.77.217.138:3003`
- Use when: Wayne asks about Jarvis, the AI assistant, or Memorae

**LoopVybz:**
- URL: `http://187.77.217.138:8080` (or whatever port LoopVybz runs on)
- Use when: Wayne asks about LoopVybz, the video generation platform

**Local Development:**
- URL: `http://localhost:3000` (adjust port as needed)
- Use when: Showing work in progress on local server

### What Happens

1. Dashboard receives your liveView message
2. Automatically switches to Live View tab (#7)
3. Loads the URL in an embedded iframe
4. Shows notification: "{Your name} is showing: {URL}"
5. Wayne can see the project live, refresh it, or go fullscreen

### Voice Commands Wayne Might Use

- "Show me the Jarvis dashboard"
- "Let me see what you're working on"
- "Open the LoopVybz project"
- "Display the homepage"
- "Show me the current status"

### Response Pattern

When Wayne requests to see something:

1. Acknowledge: "Sure, opening the Jarvis dashboard in Live View"
2. Send the liveView WebSocket message
3. Confirm: "The Jarvis dashboard is now showing in your Live View tab"

### Example Conversation

**Wayne:** "Ryan, show me the Jarvis project"

**Ryan:** "Opening the Jarvis dashboard in Live View now"

*[Sends WebSocket message with Jarvis URL]*

**Ryan:** "The Jarvis dashboard is now showing in your Live View tab. You can see the current login screen and dashboard interface."

---

## Voice Input

Wayne can now use voice input in the Chat tab:
- Click the 🎤 microphone button
- Speak your message
- Text appears in the input field automatically
- Press Send or Enter to send

No need to type - just speak naturally.
