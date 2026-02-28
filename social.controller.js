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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialController = void 0;

const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../prisma/prisma.service");
const social_facebook_service_1 = require("./social-facebook.service");
const social_youtube_service_1 = require("./social-youtube.service");
const social_tiktok_service_1 = require("./social-tiktok.service");
const social_twitter_service_1 = require("./social-twitter.service");

let SocialController = class SocialController {
    constructor(prisma, facebookService, youtubeService, tiktokService, twitterService) {
        this.prisma = prisma;
        this.facebookService = facebookService;
        this.youtubeService = youtubeService;
        this.tiktokService = tiktokService;
        this.twitterService = twitterService;
    }

    /**
     * Get social media platform connection status
     */
    async getStatus() {
        const settings = await this.prisma.settings.findFirst();
        
        const platforms = {
            facebook: {
                connected: false,
                config: null,
            },
            instagram: {
                connected: false,
                config: null,
            },
            youtube: {
                connected: false,
                config: null,
            },
            tiktok: {
                connected: false,
                config: null,
            },
            twitter: {
                connected: false,
                config: null,
            },
        };

        if (settings) {
            // Facebook/Instagram
            if (settings.social_facebook_config) {
                try {
                    const config = JSON.parse(settings.social_facebook_config);
                    const verification = await this.facebookService.verifyCredentials(config);
                    platforms.facebook.connected = verification.facebook;
                    platforms.instagram.connected = verification.instagram;
                    platforms.facebook.config = { page_id: config.page_id || null };
                    platforms.instagram.config = { instagram_account_id: config.instagram_account_id || null };
                } catch (error) {
                    console.error('Facebook config error:', error);
                }
            }

            // YouTube
            if (settings.social_youtube_config) {
                try {
                    const config = JSON.parse(settings.social_youtube_config);
                    platforms.youtube.connected = await this.youtubeService.verifyCredentials(config);
                    if (platforms.youtube.connected) {
                        const channelInfo = await this.youtubeService.getChannelInfo(config);
                        platforms.youtube.config = { channel: channelInfo };
                    }
                } catch (error) {
                    console.error('YouTube config error:', error);
                }
            }

            // TikTok
            if (settings.social_tiktok_config) {
                try {
                    const config = JSON.parse(settings.social_tiktok_config);
                    platforms.tiktok.connected = await this.tiktokService.verifyCredentials(config);
                    if (platforms.tiktok.connected) {
                        const userInfo = await this.tiktokService.getUserInfo(config);
                        platforms.tiktok.config = { user: userInfo };
                    }
                } catch (error) {
                    console.error('TikTok config error:', error);
                }
            }

            // Twitter
            if (settings.social_twitter_config) {
                try {
                    const config = JSON.parse(settings.social_twitter_config);
                    platforms.twitter.connected = await this.twitterService.verifyCredentials(config);
                    if (platforms.twitter.connected) {
                        const userInfo = await this.twitterService.getUserInfo(config);
                        platforms.twitter.config = { user: userInfo };
                    }
                } catch (error) {
                    console.error('Twitter config error:', error);
                }
            }
        }

        return platforms;
    }

    /**
     * Connect Facebook/Instagram
     */
    async connectFacebook(body) {
        const { page_id, access_token, instagram_account_id } = body;

        if (!page_id && !instagram_account_id) {
            throw new common_1.BadRequestException('Either page_id or instagram_account_id must be provided');
        }

        const config = {
            page_id: page_id || '',
            access_token: access_token || '',
            instagram_account_id: instagram_account_id || '',
        };

        // Verify credentials
        const verification = await this.facebookService.verifyCredentials(config);
        
        if (!verification.facebook && !verification.instagram) {
            throw new common_1.BadRequestException('Invalid credentials - could not verify Facebook or Instagram access');
        }

        // Store in settings
        await this.updateSocialConfig('social_facebook_config', config);

        return {
            success: true,
            facebook: verification.facebook,
            instagram: verification.instagram,
        };
    }

    /**
     * Connect YouTube
     */
    async connectYoutube(body) {
        const { access_token } = body;

        if (!access_token) {
            throw new common_1.BadRequestException('access_token is required');
        }

        const config = { access_token };

        // Verify credentials
        const isValid = await this.youtubeService.verifyCredentials(config);
        
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid YouTube access token');
        }

        // Get channel info
        const channelInfo = await this.youtubeService.getChannelInfo(config);

        // Store in settings
        await this.updateSocialConfig('social_youtube_config', config);

        return {
            success: true,
            channel: channelInfo,
        };
    }

    /**
     * Connect TikTok
     */
    async connectTiktok(body) {
        const { access_token } = body;

        if (!access_token) {
            throw new common_1.BadRequestException('access_token is required');
        }

        const config = { access_token };

        // Verify credentials
        const isValid = await this.tiktokService.verifyCredentials(config);
        
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid TikTok access token');
        }

        // Get user info
        const userInfo = await this.tiktokService.getUserInfo(config);

        // Store in settings
        await this.updateSocialConfig('social_tiktok_config', config);

        return {
            success: true,
            user: userInfo,
        };
    }

    /**
     * Connect Twitter
     */
    async connectTwitter(body) {
        const { api_key, api_secret, access_token, access_token_secret } = body;

        if (!api_key || !api_secret || !access_token || !access_token_secret) {
            throw new common_1.BadRequestException('All Twitter credentials are required (api_key, api_secret, access_token, access_token_secret)');
        }

        const config = { api_key, api_secret, access_token, access_token_secret };

        // Verify credentials
        const isValid = await this.twitterService.verifyCredentials(config);
        
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid Twitter credentials');
        }

        // Get user info
        const userInfo = await this.twitterService.getUserInfo(config);

        // Store in settings
        await this.updateSocialConfig('social_twitter_config', config);

        return {
            success: true,
            user: userInfo,
        };
    }

    /**
     * Publish a post to a specific platform
     */
    async publishPost(platform, postId) {
        // Get post with video
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                versions: {
                    include: { videoAsset: true },
                },
            },
        });

        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }

        const activeVersion = post.versions.find(v => v.id === post.active_version_id);
        
        if (!activeVersion?.videoAsset?.mp4_url) {
            throw new common_1.BadRequestException('Post has no active video');
        }

        const videoUrl = activeVersion.videoAsset.mp4_url;

        // Get platform config
        const settings = await this.prisma.settings.findFirst();
        if (!settings) {
            throw new common_1.BadRequestException('Settings not configured');
        }

        let result;
        let configKey;

        switch (platform) {
            case 'facebook':
                configKey = 'social_facebook_config';
                if (!settings[configKey]) {
                    throw new common_1.BadRequestException('Facebook not configured');
                }
                result = await this.facebookService.publishToFacebook(
                    JSON.parse(settings[configKey]),
                    post,
                    videoUrl
                );
                break;

            case 'instagram':
                configKey = 'social_facebook_config';
                if (!settings[configKey]) {
                    throw new common_1.BadRequestException('Instagram not configured');
                }
                result = await this.facebookService.publishToInstagram(
                    JSON.parse(settings[configKey]),
                    post,
                    videoUrl
                );
                break;

            case 'youtube':
                configKey = 'social_youtube_config';
                if (!settings[configKey]) {
                    throw new common_1.BadRequestException('YouTube not configured');
                }
                result = await this.youtubeService.publishToYoutube(
                    JSON.parse(settings[configKey]),
                    post,
                    videoUrl
                );
                break;

            case 'tiktok':
                configKey = 'social_tiktok_config';
                if (!settings[configKey]) {
                    throw new common_1.BadRequestException('TikTok not configured');
                }
                result = await this.tiktokService.publishToTiktok(
                    JSON.parse(settings[configKey]),
                    post,
                    videoUrl
                );
                break;

            case 'twitter':
                configKey = 'social_twitter_config';
                if (!settings[configKey]) {
                    throw new common_1.BadRequestException('Twitter not configured');
                }
                result = await this.twitterService.publishToTwitter(
                    JSON.parse(settings[configKey]),
                    post,
                    videoUrl
                );
                break;

            default:
                throw new common_1.BadRequestException(`Unknown platform: ${platform}`);
        }

        // Record distribution
        const distribution = await this.prisma.distribution.create({
            data: {
                post_id: postId,
                platform,
                status: 'POSTED',
                platform_id: result.platform_id,
                platform_url: result.platform_url,
                posted_at: new Date(),
            },
        });

        return {
            success: true,
            distribution,
            ...result,
        };
    }

    /**
     * Helper to update social config in settings
     */
    async updateSocialConfig(key, config) {
        const settings = await this.prisma.settings.findFirst();
        
        const data = {
            [key]: JSON.stringify(config),
        };

        if (settings) {
            await this.prisma.settings.update({
                where: { id: settings.id },
                data,
            });
        } else {
            await this.prisma.settings.create({
                data: {
                    id: 'singleton',
                    ...data,
                },
            });
        }
    }
};
exports.SocialController = SocialController;

__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getStatus", null);

__decorate([
    (0, common_1.Post)('facebook/connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "connectFacebook", null);

__decorate([
    (0, common_1.Post)('youtube/connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "connectYoutube", null);

__decorate([
    (0, common_1.Post)('tiktok/connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "connectTiktok", null);

__decorate([
    (0, common_1.Post)('twitter/connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "connectTwitter", null);

__decorate([
    (0, common_1.Post)(':platform/publish/:postId'),
    __param(0, (0, common_1.Param)('platform')),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "publishPost", null);

exports.SocialController = SocialController = __decorate([
    (0, common_1.Controller)('admin/social'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [
        prisma_service_1.PrismaService,
        social_facebook_service_1.SocialFacebookService,
        social_youtube_service_1.SocialYoutubeService,
        social_tiktok_service_1.SocialTiktokService,
        social_twitter_service_1.SocialTwitterService
    ])
], SocialController);
//# sourceMappingURL=social.controller.js.map
