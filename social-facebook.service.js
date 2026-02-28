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
exports.SocialFacebookService = void 0;
const common_1 = require("@nestjs/common");

let SocialFacebookService = class SocialFacebookService {
    constructor() {
        this.FB_API_VERSION = 'v21.0';
        this.FB_GRAPH_URL = 'https://graph.facebook.com';
    }

    /**
     * Publish video to Facebook Page
     */
    async publishToFacebook(config, post, videoUrl) {
        const { page_id, access_token } = config;
        
        if (!page_id || !access_token) {
            throw new Error('Facebook: Missing page_id or access_token in configuration');
        }

        try {
            // Step 1: Initialize video upload
            const initUrl = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${page_id}/videos`;
            const initParams = new URLSearchParams({
                access_token,
                upload_phase: 'start',
                file_size: '0', // We'll use URL upload instead
            });

            // Step 2: Upload video from URL
            const uploadParams = new URLSearchParams({
                access_token,
                file_url: videoUrl,
                description: `${post.caption}\n\nRead more: https://loopvybz.com/posts/${post.id}`,
                title: post.headline,
            });

            const response = await fetch(`${initUrl}?${uploadParams.toString()}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            return {
                platform_id: data.id,
                platform_url: `https://www.facebook.com/${data.id}`,
            };
        } catch (error) {
            throw new Error(`Facebook publish failed: ${error.message}`);
        }
    }

    /**
     * Publish video to Instagram Reels
     */
    async publishToInstagram(config, post, videoUrl) {
        const { instagram_account_id, access_token } = config;
        
        if (!instagram_account_id || !access_token) {
            throw new Error('Instagram: Missing instagram_account_id or access_token in configuration');
        }

        try {
            // Step 1: Create media container for Reel
            const containerUrl = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${instagram_account_id}/media`;
            const containerParams = new URLSearchParams({
                access_token,
                media_type: 'REELS',
                video_url: videoUrl,
                caption: `${post.caption}\n\n#CaribbeanNews #Trending\n\nFull story: https://loopvybz.com/posts/${post.id}`,
            });

            const containerResponse = await fetch(`${containerUrl}?${containerParams.toString()}`, {
                method: 'POST',
            });

            if (!containerResponse.ok) {
                const error = await containerResponse.json();
                throw new Error(`Instagram container creation error: ${error.error?.message || containerResponse.statusText}`);
            }

            const containerData = await containerResponse.json();
            const creationId = containerData.id;

            // Step 2: Poll for container status
            await this.pollInstagramContainerStatus(instagram_account_id, creationId, access_token);

            // Step 3: Publish the container
            const publishUrl = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${instagram_account_id}/media_publish`;
            const publishParams = new URLSearchParams({
                access_token,
                creation_id: creationId,
            });

            const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
                method: 'POST',
            });

            if (!publishResponse.ok) {
                const error = await publishResponse.json();
                throw new Error(`Instagram publish error: ${error.error?.message || publishResponse.statusText}`);
            }

            const publishData = await publishResponse.json();
            
            return {
                platform_id: publishData.id,
                platform_url: `https://www.instagram.com/reel/${publishData.id}`,
            };
        } catch (error) {
            throw new Error(`Instagram publish failed: ${error.message}`);
        }
    }

    /**
     * Poll Instagram container status until ready
     */
    async pollInstagramContainerStatus(accountId, containerId, accessToken, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            const statusUrl = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${containerId}`;
            const statusParams = new URLSearchParams({
                access_token: accessToken,
                fields: 'status_code',
            });

            const response = await fetch(`${statusUrl}?${statusParams.toString()}`);
            const data = await response.json();

            if (data.status_code === 'FINISHED') {
                return;
            } else if (data.status_code === 'ERROR') {
                throw new Error('Instagram container processing failed');
            }

            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error('Instagram container processing timeout');
    }

    /**
     * Verify credentials are valid
     */
    async verifyCredentials(config) {
        const { page_id, access_token, instagram_account_id } = config;

        const results = {
            facebook: false,
            instagram: false,
        };

        // Verify Facebook
        if (page_id && access_token) {
            try {
                const url = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${page_id}`;
                const params = new URLSearchParams({
                    access_token,
                    fields: 'id,name',
                });

                const response = await fetch(`${url}?${params.toString()}`);
                results.facebook = response.ok;
            } catch (error) {
                results.facebook = false;
            }
        }

        // Verify Instagram
        if (instagram_account_id && access_token) {
            try {
                const url = `${this.FB_GRAPH_URL}/${this.FB_API_VERSION}/${instagram_account_id}`;
                const params = new URLSearchParams({
                    access_token,
                    fields: 'id,username',
                });

                const response = await fetch(`${url}?${params.toString()}`);
                results.instagram = response.ok;
            } catch (error) {
                results.instagram = false;
            }
        }

        return results;
    }
};
exports.SocialFacebookService = SocialFacebookService;
exports.SocialFacebookService = SocialFacebookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SocialFacebookService);
//# sourceMappingURL=social-facebook.service.js.map
