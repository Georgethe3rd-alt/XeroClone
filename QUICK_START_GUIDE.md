# Quick Start Guide: Testing Social Media Integration

## Prerequisites
- Admin JWT token for authentication
- At least one LIVE post with an active video version
- Social media platform credentials (see main summary document)

## Step 1: Check Current Status
```bash
curl -X GET http://187.77.217.138:3001/admin/social/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

Expected: All platforms show `"connected": false`

## Step 2: Connect a Platform (Example: YouTube)

```bash
curl -X POST http://187.77.217.138:3001/admin/social/youtube/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_YOUTUBE_ACCESS_TOKEN"
  }' | jq
```

Expected response:
```json
{
  "success": true,
  "channel": {
    "id": "UCxxxxx",
    "title": "Your Channel Name",
    "subscribers": "123"
  }
}
```

## Step 3: Verify Connection
```bash
curl -X GET http://187.77.217.138:3001/admin/social/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

Expected: YouTube now shows `"connected": true`

## Step 4: Publish a Post

First, get a LIVE post ID from your database:
```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "PGPASSWORD=cnpass psql -h localhost -U cnuser -d caribbeannews \
  -c \"SELECT id, headline, status FROM posts WHERE status = 'LIVE' LIMIT 1;\""
```

Then publish it:
```bash
curl -X POST http://187.77.217.138:3001/admin/social/youtube/publish/POST_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

Expected response:
```json
{
  "success": true,
  "distribution": {
    "id": "dist_xxx",
    "post_id": "POST_ID_HERE",
    "platform": "youtube",
    "status": "POSTED",
    "platform_id": "dQw4w9WgXcQ",
    "platform_url": "https://www.youtube.com/watch?v=...",
    "posted_at": "2026-02-28T..."
  },
  "platform_id": "...",
  "platform_url": "https://..."
}
```

## Step 5: Check Distribution Status

```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "PGPASSWORD=cnpass psql -h localhost -U cnuser -d caribbeannews \
  -c \"SELECT * FROM distributions ORDER BY created_at DESC LIMIT 5;\""
```

Look for `status = 'POSTED'` or `status = 'FAILED'` with error message.

## Step 6: Publish to Multiple Platforms

Using the existing distribution endpoint:
```bash
curl -X POST http://187.77.217.138:3001/admin/posts/POST_ID_HERE/distribute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["facebook", "youtube", "twitter"]
  }' | jq
```

This creates distribution records and processes them asynchronously.

## Testing Each Platform

### Facebook
```bash
curl -X POST http://187.77.217.138:3001/admin/social/facebook/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_id": "YOUR_PAGE_ID",
    "access_token": "YOUR_PAGE_ACCESS_TOKEN"
  }'

curl -X POST http://187.77.217.138:3001/admin/social/facebook/publish/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Instagram
```bash
curl -X POST http://187.77.217.138:3001/admin/social/facebook/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_id": "YOUR_PAGE_ID",
    "access_token": "YOUR_PAGE_ACCESS_TOKEN",
    "instagram_account_id": "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID"
  }'

curl -X POST http://187.77.217.138:3001/admin/social/instagram/publish/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### TikTok
```bash
curl -X POST http://187.77.217.138:3001/admin/social/tiktok/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_TIKTOK_ACCESS_TOKEN"
  }'

curl -X POST http://187.77.217.138:3001/admin/social/tiktok/publish/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Twitter/X
```bash
curl -X POST http://187.77.217.138:3001/admin/social/twitter/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "api_secret": "YOUR_API_SECRET",
    "access_token": "YOUR_ACCESS_TOKEN",
    "access_token_secret": "YOUR_ACCESS_TOKEN_SECRET"
  }'

curl -X POST http://187.77.217.138:3001/admin/social/twitter/publish/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Check Container Logs
```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "docker logs loopvibz-api-1 --tail 100 --follow"
```

### Check Failed Distributions
```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "PGPASSWORD=cnpass psql -h localhost -U cnuser -d caribbeannews \
  -c \"SELECT platform, status, error FROM distributions WHERE status = 'FAILED' ORDER BY created_at DESC LIMIT 10;\""
```

### Restart Container
```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "docker restart loopvibz-api-1"
```

### Verify Files Are in Place
```bash
sshpass -p '#Reshmamaraj19' ssh root@187.77.217.138 \
  "docker exec loopvibz-api-1 ls -la /app/apps/api/dist/src/social/"
```

## Next Steps

1. Get real credentials for each platform you want to use
2. Test with a few posts manually first
3. Once working, integrate into your editorial workflow
4. Set up monitoring for failed distributions
5. Consider implementing auto-publish for breaking news

---

**Pro Tip:** Start with one platform (YouTube is easiest to get credentials for) and verify it works end-to-end before adding others.
