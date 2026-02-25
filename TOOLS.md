# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## AgentMail

- **API Key**: `am_us_73fd4a85015305727531045fb16f2519ca8a2203b55a24c11ea251479b203143`
- **Service**: Email API that gives AI agents their own inboxes
- **Webhook Path**: `/hooks/agentmail` (configured)
- **Webhook Token**: `AGENTMAIL_WEBHOOK_SECRET_2026`

## Communication Channels

### Telegram
- Bot configured with open DM policy
- Token: <TELEGRAM_BOT_TOKEN>
- Username: (pending - check after gateway restart)

## Twilio

- **Account SID**: `[REDACTED]`
- **Auth Token**: `[REDACTED]`
- **Phone Numbers**:
  - **Primary**: +12184195528 (George OpenClaw Assistant) - Voice & SMS
  - **Secondary**: +19377198749 - Voice & SMS
- **Service**: Voice calls and voice notes capability
- **Status**: Voice plugin needs proper installation, but can use SMS API directly

## OpenAI

- **API Key**: `[REDACTED]`
- **Services**: GPT models (fallback LLM), Whisper (speech-to-text), TTS
- **Status**: ✅ Working - Whisper transcription tested successfully

## ElevenLabs

- **API Key**: `[REDACTED]`
- **Voice ID**: `onwK4e9ZLuTAKqWW03F9` (Daniel - Steady Broadcaster, British, Formal)
- **Model**: `eleven_multilingual_v2`
- **Service**: Natural text-to-speech synthesis
- **Status**: API tested and working, config needs manual patching

## Webhooks
- Base path: `/hooks`
- AgentMail webhook: `/hooks/agentmail`
- Requires Bearer token authentication
- Twilio Voice Webhook: https://gentle-boxes-wait.loca.lt/voice (temporary localtunnel)
- Two-way voice calls: Working with speech recognition

## GitHub

- **Username**: Georgethe3rd-alt (Wayne's account)
- **Repository**: https://github.com/Georgethe3rd-alt/Georgethe3rd
- **SSH Key Generated**: Yes
- **SSH Public Key**: 
  ```
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIChK2hE/M6mGlgkMFPbsZjgofv94jX/Eah7wFonDmxg8 george-openclaw@agentmail.to
  ```
- **Status**: Repository initialized, SSH key needs to be added to GitHub account

---