# LOOPVYBZ Social Media Distribution API - Integration Summary

## Overview
Real social media distribution API integrations have been successfully added to the LOOPVYBZ NestJS API backend. The system now supports publishing video posts to Facebook, Instagram, YouTube, TikTok, and Twitter/X.

## Database Changes
Added the following columns to the `settings` table:
- `social_facebook_config` (TEXT) - Stores Facebook/Instagram credentials
- `social_youtube_config` (TEXT) - Stores YouTube credentials
- `social_tiktok_config` (TEXT) - Stores TikTok credentials
- `social_twitter_config` (TEXT) - Stores Twitter/X credentials

## Files Created

### Service Files (Location: `/app/apps/api/dist/src/social/`)
1. **social-facebook.service.js** - Facebook & Instagram integration
2. **social-youtube.service.js** - YouTube integration
3. **social-tiktok.service.js** - TikTok integration
4. **social-twitter.service.js** - Twitter/X integration

### Controller & Module
5. **social.controller.js** - Admin endpoints for social media management
6. **social.module.js** - NestJS module configuration

### Updated Files
- `/app/apps/api/dist/src/app.module.js` - Added SocialModule import
- `/app/apps/api/dist/src/distribution/distribution.service.js` - Integrated social services
- `/app/apps/api/dist/src/distribution/distribution.module.js` - Added SocialModule dependency

## API Endpoints

### Get Platform Status
**GET** `/admin/social/status`

Returns connection status for all configured platforms.

**Response:**
```json
{
  "facebook": {
    "connected": true/false,
    "config": { "page_id": "..." }
  },
  "instagram": {
    "connected": true/false,
    "config": { "instagram_account_id": "..." }
  },
  "youtube": {
    "connected": true/false,
    "config": { "channel": { "id": "...", "title": "...", "subscribers": "..." } }
  },
  "tiktok": {
    "connected": true/false,
    "config": { "user": { "open_id": "...", "display_name": "..." } }
  },
  "twitter": {
    "connected": true/false,
    "config": { "user": { "id": "...", "username": "..." } }
  }
}
```

---

### Connect Facebook/Instagram
**POST** `/admin/social/facebook/connect`

**Request Body:**
```json
{
  "page_id": "YOUR_FACEBOOK_PAGE_ID",
  "access_token": "YOUR_FACEBOOK_PAGE_ACCESS_TOKEN",
  "instagram_account_id": "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID"
}
```

**Notes:**
- You can provide just `page_id` for Facebook-only
- Both `page_id` and `instagram_account_id` share the same `access_token`
- The access token must have permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

**How to Get Credentials:**
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create an app or use existing app
3. Add "Facebook Login" and "Instagram Basic Display" products
4. Get Page Access Token from Graph API Explorer
5. Convert short-lived token to long-lived token (60+ days)
6. Get Instagram Business Account ID from Graph API: `/{page-id}?fields=instagram_business_account`

**Response:**
```json
{
  "success": true,
  "facebook": true,
  "instagram": true
}
```

---

### Connect YouTube
**POST** `/admin/social/youtube/connect`

**Request Body:**
```json
{
  "access_token": "YOUR_YOUTUBE_OAUTH2_ACCESS_TOKEN"
}
```

**Notes:**
- Requires OAuth 2.0 access token with scope: `https://www.googleapis.com/auth/youtube.upload`
- Access token should be a long-lived refresh token

**How to Get Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Web application)
4. Implement OAuth flow to get access token + refresh token
5. For now, use manual token entry (full OAuth flow needs redirect URLs)

**Response:**
```json
{
  "success": true,
  "channel": {
    "id": "UCxxxxx",
    "title": "Channel Name",
    "subscribers": "1234"
  }
}
```

---

### Connect TikTok
**POST** `/admin/social/tiktok/connect`

**Request Body:**
```json
{
  "access_token": "YOUR_TIKTOK_ACCESS_TOKEN"
}
```

**Notes:**
- Requires TikTok for Developers access token
- Scopes needed: `video.upload`, `video.publish`

**How to Get Credentials:**
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create an app and request Content Posting API access
3. Implement OAuth 2.0 flow to get access token
4. For now, use manual token entry

**Response:**
```json
{
  "success": true,
  "user": {
    "open_id": "xxxxx",
    "display_name": "Username",
    "username": "username"
  }
}
```

---

### Connect Twitter/X
**POST** `/admin/social/twitter/connect`

**Request Body:**
```json
{
  "api_key": "YOUR_TWITTER_API_KEY",
  "api_secret": "YOUR_TWITTER_API_SECRET",
  "access_token": "YOUR_TWITTER_ACCESS_TOKEN",
  "access_token_secret": "YOUR_TWITTER_ACCESS_TOKEN_SECRET"
}
```

**Notes:**
- Requires Twitter API v2 with Elevated access
- All four credentials are required

**How to Get Credentials:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app (or use existing)
3. Request Elevated access (required for media upload)
4. Generate API Key & Secret under "Keys and tokens"
5. Generate Access Token & Secret under "Keys and tokens"
6. Make sure the app has Read + Write permissions

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123456789",
    "username": "loopvybz",
    "name": "LOOPVYBZ"
  }
}
```

---

### Publish Post to Platform
**POST** `/admin/social/:platform/publish/:postId`

**Parameters:**
- `platform` - One of: `facebook`, `instagram`, `youtube`, `tiktok`, `twitter`
- `postId` - The ID of the post to publish

**Example:**
```
POST /admin/social/youtube/publish/clx1234567890
```

**Notes:**
- Post must have status = `LIVE` and an active video version
- Platform must be configured (credentials stored)
- Creates a `distribution` record in the database

**Response:**
```json
{
  "success": true,
  "distribution": {
    "id": "dist_xxx",
    "post_id": "clx1234567890",
    "platform": "youtube",
    "status": "POSTED",
    "platform_id": "dQw4w9WgXcQ",
    "platform_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "posted_at": "2026-02-28T12:00:00.000Z"
  },
  "platform_id": "dQw4w9WgXcQ",
  "platform_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

---

## Content Formatting

### Facebook
- Uses post `caption` as description
- Adds link back to loopvybz.com
- Publishes as native video post to Page

### Instagram Reels
- Uses post `caption` with hashtags
- Adds #CaribbeanNews #Trending
- Publishes as Reels (vertical video format works best)
- Link back to loopvybz.com in caption

### YouTube
- Title: Post `headline` (max 100 chars)
- Description: Post `caption` + category + hashtags
- Tags: Post `tags` + category + "Caribbean" + "News" + "LOOPVYBZ"
- Category: "News & Politics" (categoryId: 25)
- Privacy: Public
- Made for Kids: No

### TikTok
- Title: Post `headline` (max 150 chars)
- Privacy: Public
- Allows: Duet, Comment, Stitch

### Twitter/X
- Tweet text: `{headline}\n\n{caption (200 chars)}...\n\nRead more: {link}\n\n#CaribbeanNews #Trending`
- Max 280 characters total
- Video attached as media
- Uploads in chunks (5MB per chunk)

---

## Error Handling

All platform services include comprehensive error handling:

### Common Errors
- **Missing credentials**: Returns error if platform not configured
- **Invalid tokens**: Returns error if access token expired or invalid
- **Video download failed**: Returns error if can't fetch video from mp4_url
- **API rate limits**: Returns error with rate limit message
- **Upload timeout**: Returns error if processing takes too long

### Distribution Status Tracking
Each distribution attempt is recorded in the `distributions` table with:
- `status`: `PENDING`, `POSTED`, or `FAILED`
- `error`: Error message if failed
- `platform_id`: External platform's video/post ID
- `platform_url`: Direct link to published content
- `posted_at`: Timestamp of successful posting

---

## Auto-Distribution Option

The existing distribution service supports auto-publishing when a post goes LIVE:

**POST** `/admin/posts/:id/distribute`

**Request Body:**
```json
{
  "platforms": ["facebook", "instagram", "youtube", "tiktok", "twitter"]
}
```

This creates distribution records for each platform and processes them asynchronously.

---

## Testing & Verification

### Test Connection Status
```bash
curl -X GET http://187.77.217.138:3001/admin/social/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Publishing
```bash
curl -X POST http://187.77.217.138:3001/admin/social/youtube/publish/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Next Steps (Optional Enhancements)

1. **Full OAuth Flows**: Implement redirect-based OAuth for Facebook, YouTube, TikTok instead of manual token entry
2. **Token Refresh**: Add automatic token refresh logic for expired tokens
3. **Scheduling**: Add ability to schedule posts to platforms at specific times
4. **Analytics**: Track engagement metrics from each platform
5. **Bulk Publishing**: Add endpoint to publish multiple posts at once
6. **Platform-Specific Optimizations**:
   - Instagram: Auto-crop videos to 9:16 for Reels
   - YouTube: Add chapters/timestamps based on script
   - TikTok: Auto-add trending sounds
7. **Retry Logic**: Automatic retry on temporary failures (rate limits, network issues)
8. **Webhook Handlers**: Receive callbacks from platforms about post performance

---

## Production Checklist

Before going live:
- [ ] Test each platform integration with real accounts
- [ ] Verify access tokens are long-lived (60+ days)
- [ ] Set up monitoring/alerts for failed distributions
- [ ] Document token refresh procedures
- [ ] Test error handling for each platform
- [ ] Verify video URLs are publicly accessible
- [ ] Check rate limits for each platform API
- [ ] Add logging for distribution attempts
- [ ] Set up backup credentials (if platform supports multiple apps)

---

## Platform API Documentation Links

- **Facebook**: https://developers.facebook.com/docs/graph-api/reference/page/videos/
- **Instagram**: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- **YouTube**: https://developers.google.com/youtube/v3/docs/videos/insert
- **TikTok**: https://developers.tiktok.com/doc/content-posting-api-get-started
- **Twitter**: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets

---

## Support

For issues or questions about the social media integration:
1. Check container logs: `docker logs loopvibz-api-1`
2. Verify database columns were added: `\d settings` in psql
3. Check platform API status pages
4. Review distribution records: `SELECT * FROM distributions WHERE status = 'FAILED';`

---

**Integration Complete!** ✅

All social media platforms are now ready to receive automated video distributions from LOOPVYBZ. Configure credentials via the `/admin/social/:platform/connect` endpoints and start publishing with `/admin/social/:platform/publish/:postId`.
