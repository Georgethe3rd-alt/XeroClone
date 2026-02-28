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
exports.SocialTiktokService = void 0;

const common_1 = require("@nestjs/common");

let SocialTiktokService = class SocialTiktokService {
    constructor() {
        this.TIKTOK_API_URL = 'https://open.tiktokapis.com/v2';
    }

    /**
     * Publish video to TikTok
     */
    async publishToTiktok(config, post, videoUrl) {
        const { access_token } = config;
        
        if (!access_token) {
            throw new Error('TikTok: Missing access_token in configuration');
        }

        try {
            // Step 1: Initialize direct post
            const initUrl = `${this.TIKTOK_API_URL}/post/publish/inbox/video/init/`;
            
            // Download video to get size
            const videoResponse = await fetch(videoUrl);
            if (!videoResponse.ok) {
                throw new Error(`Failed to download video: ${videoResponse.statusText}`);
            }
            const videoBuffer = await videoResponse.arrayBuffer();

            const initPayload = {
                post_info: {
                    title: post.headline.substring(0, 150), // TikTok title limit
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                    video_cover_timestamp_ms: 1000,
                },
                source_info: {
                    source: 'FILE_UPLOAD',
                    video_size: videoBuffer.byteLength,
                    chunk_size: videoBuffer.byteLength,
                    total_chunk_count: 1,
                },
            };

            const initResponse = await fetch(initUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(initPayload),
            });

            if (!initResponse.ok) {
                const error = await initResponse.json();
                throw new Error(`TikTok init error: ${error.error?.message || initResponse.statusText}`);
            }

            const initData = await initResponse.json();
            const publishId = initData.data.publish_id;
            const uploadUrl = initData.data.upload_url;

            // Step 2: Upload video
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Length': videoBuffer.byteLength.toString(),
                },
                body: videoBuffer,
            });

            if (!uploadResponse.ok) {
                throw new Error(`TikTok upload error: ${uploadResponse.statusText}`);
            }

            // Step 3: Get publish status
            const statusUrl = `${this.TIKTOK_API_URL}/post/publish/status/fetch/`;
            const statusPayload = {
                publish_id: publishId,
            };

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 30;
            
            while (attempts < maxAttempts) {
                const statusResponse = await fetch(statusUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify(statusPayload),
                });

                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    const status = statusData.data.status;

                    if (status === 'PUBLISH_COMPLETE') {
                        return {
                            platform_id: statusData.data.publicaly_available_post_id?.[0] || publishId,
                            platform_url: `https://www.tiktok.com/@loopvybz/video/${statusData.data.publicly_available_post_id?.[0] || publishId}`,
                        };
                    } else if (status === 'FAILED') {
                        throw new Error(`TikTok publish failed: ${statusData.data.error?.message || 'Unknown error'}`);
                    }
                }

                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }

            throw new Error('TikTok publish timeout');
        } catch (error) {
            throw new Error(`TikTok publish failed: ${error.message}`);
        }
    }

    /**
     * Verify credentials are valid
     */
    async verifyCredentials(config) {
        const { access_token } = config;

        if (!access_token) {
            return false;
        }

        try {
            // Test with user info request
            const url = `${this.TIKTOK_API_URL}/user/info/`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(config) {
        const { access_token } = config;

        if (!access_token) {
            throw new Error('TikTok: Missing access_token');
        }

        try {
            const url = `${this.TIKTOK_API_URL}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`TikTok API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.data.user;
        } catch (error) {
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }
};
exports.SocialTiktokService = SocialTiktokService;
exports.SocialTiktokService = SocialTiktokService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SocialTiktokService);
//# sourceMappingURL=social-tiktok.service.js.map
