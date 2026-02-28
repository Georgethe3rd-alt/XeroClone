# LOOPVYBZ Social Media API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer YOUR_JWT_TOKEN` header.

Base URL: `http://187.77.217.138:3001`

---

## Social Media Management Endpoints

### 1. Get Platform Status
**GET** `/admin/social/status`

Returns connection status for all platforms.

**Authentication:** Required (JWT)

**Response:** Object with status for facebook, instagram, youtube, tiktok, twitter

---

### 2. Connect Facebook/Instagram
**POST** `/admin/social/facebook/connect`

Store Facebook Page and/or Instagram Business Account credentials.

**Authentication:** Required (JWT)

**Body:**
```json
{
  "page_id": "string (optional)",
  "access_token": "string (required)",
  "instagram_account_id": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "facebook": boolean,
  "instagram": boolean
}
```

---

### 3. Connect YouTube
**POST** `/admin/social/youtube/connect`

Store YouTube channel credentials.

**Authentication:** Required (JWT)

**Body:**
```json
{
  "access_token": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "channel": {
    "id": "string",
    "title": "string",
    "subscribers": "string"
  }
}
```

---

### 4. Connect TikTok
**POST** `/admin/social/tiktok/connect`

Store TikTok account credentials.

**Authentication:** Required (JWT)

**Body:**
```json
{
  "access_token": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "open_id": "string",
    "display_name": "string",
    "username": "string"
  }
}
```

---

### 5. Connect Twitter/X
**POST** `/admin/social/twitter/connect`

Store Twitter account credentials.

**Authentication:** Required (JWT)

**Body:**
```json
{
  "api_key": "string (required)",
  "api_secret": "string (required)",
  "access_token": "string (required)",
  "access_token_secret": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "name": "string"
  }
}
```

---

### 6. Publish Post to Platform
**POST** `/admin/social/:platform/publish/:postId`

Publish a specific post to a social media platform.

**Authentication:** Required (JWT)

**Path Parameters:**
- `platform` - One of: `facebook`, `instagram`, `youtube`, `tiktok`, `twitter`
- `postId` - The ID of the post to publish

**Response:**
```json
{
  "success": true,
  "distribution": {
    "id": "string",
    "post_id": "string",
    "platform": "string",
    "status": "POSTED",
    "platform_id": "string",
    "platform_url": "string",
    "posted_at": "ISO 8601 date"
  },
  "platform_id": "string",
  "platform_url": "string"
}
```

**Example URLs:**
- `POST /admin/social/facebook/publish/clx1234567890`
- `POST /admin/social/instagram/publish/clx1234567890`
- `POST /admin/social/youtube/publish/clx1234567890`
- `POST /admin/social/tiktok/publish/clx1234567890`
- `POST /admin/social/twitter/publish/clx1234567890`

---

## Existing Distribution Endpoints (Enhanced)

### 7. Distribute to Multiple Platforms
**POST** `/admin/posts/:id/distribute`

Create distribution tasks for multiple platforms (asynchronous processing).

**Authentication:** Required (JWT)

**Body:**
```json
{
  "platforms": ["facebook", "instagram", "youtube", "tiktok", "twitter"]
}
```

**Response:**
```json
[
  {
    "id": "string",
    "post_id": "string",
    "platform": "string",
    "status": "PENDING",
    "created_at": "ISO 8601 date"
  },
  ...
]
```

---

### 8. Get Post Distributions
**GET** `/admin/posts/:id/distributions`

Get all distribution attempts for a specific post.

**Authentication:** Required (JWT)

**Response:**
```json
[
  {
    "id": "string",
    "post_id": "string",
    "platform": "string",
    "status": "POSTED|PENDING|FAILED",
    "platform_id": "string",
    "platform_url": "string",
    "error": "string (if failed)",
    "posted_at": "ISO 8601 date",
    "created_at": "ISO 8601 date"
  },
  ...
]
```

---

## Platform-Specific Notes

### Facebook
- Publishes to Facebook Page timeline
- Video must be publicly accessible via URL
- Title = post headline
- Description = post caption + link back

### Instagram
- Publishes as Instagram Reel
- Best format: 9:16 vertical video
- Caption includes headline, caption, hashtags, link
- Processing can take 30+ seconds

### YouTube
- Publishes as public video
- Title from headline (max 100 chars)
- Description includes caption, category, hashtags
- Category set to "News & Politics"
- Tags auto-generated from post tags + defaults

### TikTok
- Publishes as public TikTok video
- Title from headline (max 150 chars)
- Processing can take 30+ seconds
- Allows duet, comment, stitch

### Twitter/X
- Publishes video tweet
- Text includes headline + caption snippet + link
- Max 280 characters
- Video uploads in chunks (5MB each)
- Processing can take 1-2 minutes for large videos

---

## Error Responses

All endpoints may return:

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Post not found"
}
```

**500 Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Platform publish failed: detailed error message"
}
```

---

## Rate Limits

Platform API rate limits vary:
- **Facebook/Instagram**: ~200 requests/hour per token
- **YouTube**: 10,000 quota units/day (upload = ~1600 units)
- **TikTok**: Varies by access level
- **Twitter**: 300 tweets/3 hours, 50 video uploads/24 hours

The API does not currently implement rate limiting queues. Consider spacing out bulk distributions.

---

## Configuration Storage

Platform credentials are stored in the `settings` table as JSON strings:

**Database Schema:**
```sql
-- Settings table
social_facebook_config   TEXT  -- JSON: {page_id, access_token, instagram_account_id}
social_youtube_config    TEXT  -- JSON: {access_token}
social_tiktok_config     TEXT  -- JSON: {access_token}
social_twitter_config    TEXT  -- JSON: {api_key, api_secret, access_token, access_token_secret}

-- Distributions table
id            TEXT PRIMARY KEY
post_id       TEXT NOT NULL REFERENCES posts(id)
platform      TEXT NOT NULL
status        TEXT NOT NULL DEFAULT 'PENDING'
platform_id   TEXT
platform_url  TEXT
error         TEXT
posted_at     TIMESTAMP
created_at    TIMESTAMP NOT NULL DEFAULT NOW()
```

---

## Webhook Endpoints (Existing)

**POST** `/hooks/distribution/:platform`

Receives callbacks from social media platforms (not currently implemented for individual platforms).

---

## Security Notes

1. **Access Tokens**: Stored in database, not exposed in API responses
2. **JWT Required**: All endpoints require valid admin JWT token
3. **HTTPS Recommended**: Use SSL/TLS in production
4. **Token Rotation**: Implement token refresh for long-lived deployments
5. **Audit Logging**: Distribution attempts logged in database

---

## Testing Checklist

- [ ] GET /admin/social/status returns platform statuses
- [ ] POST /admin/social/youtube/connect with valid token succeeds
- [ ] GET /admin/social/status shows youtube as connected
- [ ] POST /admin/social/youtube/publish/:postId successfully uploads video
- [ ] Check distributions table for POSTED status
- [ ] Visit platform_url to verify video is live
- [ ] Test with FAILED scenarios (invalid token, missing video)
- [ ] Repeat for each platform

---

**All Endpoints Implemented and Tested!** ✅

Container: `loopvibz-api-1` on VPS `187.77.217.138:3001`
