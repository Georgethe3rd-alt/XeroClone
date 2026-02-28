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
exports.SocialYoutubeService = void 0;

const common_1 = require("@nestjs/common");

let SocialYoutubeService = class SocialYoutubeService {
    constructor() {
        this.YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
        this.YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
    }

    /**
     * Publish video to YouTube
     */
    async publishToYoutube(config, post, videoUrl) {
        const { access_token } = config;
        
        if (!access_token) {
            throw new Error('YouTube: Missing access_token in configuration');
        }

        try {
            // Download video first
            const videoResponse = await fetch(videoUrl);
            if (!videoResponse.ok) {
                throw new Error(`Failed to download video: ${videoResponse.statusText}`);
            }
            const videoBuffer = await videoResponse.arrayBuffer();

            // Prepare metadata
            const tags = post.tags || [];
            const categoryTag = post.category ? [post.category] : [];
            const allTags = [...new Set([...tags, ...categoryTag, 'Caribbean', 'News', 'LOOPVYBZ'])];

            const metadata = {
                snippet: {
                    title: post.headline.substring(0, 100), // YouTube title limit
                    description: `${post.caption}\n\nCategory: ${post.category}\n\nWatch more Caribbean news at https://loopvybz.com\n\n#CaribbeanNews #Trending ${allTags.map(t => '#' + t.replace(/\s+/g, '')).join(' ')}`,
                    tags: allTags.slice(0, 30), // YouTube allows max 30 tags
                    categoryId: '25', // News & Politics category
                },
                status: {
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false,
                },
            };

            // Create multipart upload
            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const metadataPart = delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata);

            const videoPart = delimiter +
                'Content-Type: video/mp4\r\n\r\n';

            const multipartBody = new Uint8Array(
                new TextEncoder().encode(metadataPart + videoPart).length +
                videoBuffer.byteLength +
                new TextEncoder().encode(closeDelimiter).length
            );

            let offset = 0;
            const metadataBytes = new TextEncoder().encode(metadataPart + videoPart);
            multipartBody.set(metadataBytes, offset);
            offset += metadataBytes.length;
            multipartBody.set(new Uint8Array(videoBuffer), offset);
            offset += videoBuffer.byteLength;
            multipartBody.set(new TextEncoder().encode(closeDelimiter), offset);

            // Upload video
            const uploadUrl = `${this.YOUTUBE_UPLOAD_URL}?uploadType=multipart&part=snippet,status`;
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body: multipartBody,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            return {
                platform_id: data.id,
                platform_url: `https://www.youtube.com/watch?v=${data.id}`,
            };
        } catch (error) {
            throw new Error(`YouTube publish failed: ${error.message}`);
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
            // Test with a simple channel request
            const url = `${this.YOUTUBE_API_URL}/channels?part=snippet&mine=true`;
            const response = await fetch(url, {
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
     * Get channel info
     */
    async getChannelInfo(config) {
        const { access_token } = config;

        if (!access_token) {
            throw new Error('YouTube: Missing access_token');
        }

        try {
            const url = `${this.YOUTUBE_API_URL}/channels?part=snippet,statistics&mine=true`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                return {
                    id: channel.id,
                    title: channel.snippet.title,
                    subscribers: channel.statistics.subscriberCount,
                };
            }

            throw new Error('No channel found');
        } catch (error) {
            throw new Error(`Failed to get channel info: ${error.message}`);
        }
    }
};
exports.SocialYoutubeService = SocialYoutubeService;
exports.SocialYoutubeService = SocialYoutubeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SocialYoutubeService);
//# sourceMappingURL=social-youtube.service.js.map
