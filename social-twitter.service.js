"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialTwitterService = void 0;

const common_1 = require("@nestjs/common");

let SocialTwitterService = class SocialTwitterService {
    constructor() {
        this.TWITTER_API_URL = 'https://api.twitter.com/2';
        this.TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1';
    }

    /**
     * Publish video to Twitter/X
     */
    async publishToTwitter(config, post, videoUrl) {
        const { api_key, api_secret, access_token, access_token_secret } = config;
        
        if (!api_key || !api_secret || !access_token || !access_token_secret) {
            throw new Error('Twitter: Missing required credentials (api_key, api_secret, access_token, access_token_secret)');
        }

        try {
            // Download video
            const videoResponse = await fetch(videoUrl);
            if (!videoResponse.ok) {
                throw new Error(`Failed to download video: ${videoResponse.statusText}`);
            }
            const videoBuffer = await videoResponse.arrayBuffer();

            // Step 1: INIT upload
            const initUrl = `${this.TWITTER_UPLOAD_URL}/media/upload.json`;
            const initParams = new URLSearchParams({
                command: 'INIT',
                total_bytes: videoBuffer.byteLength.toString(),
                media_type: 'video/mp4',
                media_category: 'tweet_video',
            });

            const initResponse = await this.makeTwitterRequest(
                `${initUrl}?${initParams.toString()}`,
                'POST',
                config,
                null
            );

            const mediaId = initResponse.media_id_string;

            // Step 2: APPEND upload (chunked)
            const chunkSize = 5 * 1024 * 1024; // 5MB chunks
            const chunks = Math.ceil(videoBuffer.byteLength / chunkSize);

            for (let i = 0; i < chunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, videoBuffer.byteLength);
                const chunk = videoBuffer.slice(start, end);

                const formData = new URLSearchParams({
                    command: 'APPEND',
                    media_id: mediaId,
                    segment_index: i.toString(),
                });

                // For APPEND, we need to send binary data
                await this.makeTwitterRequest(
                    `${initUrl}?${formData.toString()}`,
                    'POST',
                    config,
                    chunk
                );
            }

            // Step 3: FINALIZE upload
            const finalizeParams = new URLSearchParams({
                command: 'FINALIZE',
                media_id: mediaId,
            });

            const finalizeResponse = await this.makeTwitterRequest(
                `${initUrl}?${finalizeParams.toString()}`,
                'POST',
                config,
                null
            );

            // Step 4: Wait for processing if needed
            if (finalizeResponse.processing_info) {
                await this.waitForMediaProcessing(mediaId, config);
            }

            // Step 5: Create tweet with video
            const tweetText = `${post.headline}\n\n${post.caption.substring(0, 200)}...\n\nRead more: https://loopvybz.com/posts/${post.id}\n\n#CaribbeanNews #Trending`;
            
            const tweetUrl = `${this.TWITTER_API_URL}/tweets`;
            const tweetPayload = {
                text: tweetText.substring(0, 280), // Twitter character limit
                media: {
                    media_ids: [mediaId],
                },
            };

            const tweetResponse = await this.makeTwitterRequest(
                tweetUrl,
                'POST',
                config,
                JSON.stringify(tweetPayload),
                { 'Content-Type': 'application/json' }
            );

            return {
                platform_id: tweetResponse.data.id,
                platform_url: `https://twitter.com/i/web/status/${tweetResponse.data.id}`,
            };
        } catch (error) {
            throw new Error(`Twitter publish failed: ${error.message}`);
        }
    }

    /**
     * Wait for media processing to complete
     */
    async waitForMediaProcessing(mediaId, config, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            const statusUrl = `${this.TWITTER_UPLOAD_URL}/media/upload.json`;
            const statusParams = new URLSearchParams({
                command: 'STATUS',
                media_id: mediaId,
            });

            const response = await this.makeTwitterRequest(
                `${statusUrl}?${statusParams.toString()}`,
                'GET',
                config,
                null
            );

            const state = response.processing_info?.state;
            
            if (state === 'succeeded') {
                return;
            } else if (state === 'failed') {
                throw new Error('Twitter media processing failed');
            }

            // Wait based on check_after_secs or default 2 seconds
            const waitTime = (response.processing_info?.check_after_secs || 2) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        throw new Error('Twitter media processing timeout');
    }

    /**
     * Make authenticated Twitter API request using OAuth 1.0a
     */
    async makeTwitterRequest(url, method, config, body, extraHeaders = {}) {
        const { api_key, api_secret, access_token, access_token_secret } = config;

        // Generate OAuth 1.0a signature
        const oauth = {
            oauth_consumer_key: api_key,
            oauth_token: access_token,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_nonce: Math.random().toString(36).substring(2, 15),
            oauth_version: '1.0',
        };

        // Simple OAuth header generation (in production, use a library like oauth-1.0a)
        const oauthHeader = Object.entries(oauth)
            .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
            .join(', ');

        const headers = {
            'Authorization': `OAuth ${oauthHeader}`,
            ...extraHeaders,
        };

        const response = await fetch(url, {
            method,
            headers,
            body: body,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Twitter API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    /**
     * Verify credentials are valid
     */
    async verifyCredentials(config) {
        const { api_key, api_secret, access_token, access_token_secret } = config;

        if (!api_key || !api_secret || !access_token || !access_token_secret) {
            return false;
        }

        try {
            const url = `${this.TWITTER_API_URL}/users/me`;
            await this.makeTwitterRequest(url, 'GET', config, null);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(config) {
        const { api_key, api_secret, access_token, access_token_secret } = config;

        if (!api_key || !api_secret || !access_token || !access_token_secret) {
            throw new Error('Twitter: Missing required credentials');
        }

        try {
            const url = `${this.TWITTER_API_URL}/users/me?user.fields=id,name,username,public_metrics`;
            const data = await this.makeTwitterRequest(url, 'GET', config, null);
            return data.data;
        } catch (error) {
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }
};
exports.SocialTwitterService = SocialTwitterService;
exports.SocialTwitterService = SocialTwitterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SocialTwitterService);
//# sourceMappingURL=social-twitter.service.js.map
