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
exports.DistributionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const social_facebook_service_1 = require("../social/social-facebook.service");
const social_youtube_service_1 = require("../social/social-youtube.service");
const social_tiktok_service_1 = require("../social/social-tiktok.service");
const social_twitter_service_1 = require("../social/social-twitter.service");

let DistributionService = class DistributionService {
    constructor(prisma, facebookService, youtubeService, tiktokService, twitterService) {
        this.prisma = prisma;
        this.facebookService = facebookService;
        this.youtubeService = youtubeService;
        this.tiktokService = tiktokService;
        this.twitterService = twitterService;
    }

    async distribute(postId, platforms) {
        const distributions = [];
        for (const platform of platforms) {
            const dist = await this.prisma.distribution.create({
                data: {
                    post_id: postId,
                    platform,
                    status: 'PENDING',
                },
            });
            distributions.push(dist);
            this.processDistribution(dist.id).catch(err => {
                console.error(`[Distribution] Error processing ${dist.id}:`, err);
            });
        }
        return distributions;
    }

    async getDistributions(postId) {
        return this.prisma.distribution.findMany({
            where: { post_id: postId },
            orderBy: { created_at: 'desc' },
        });
    }

    async processDistribution(distributionId) {
        const dist = await this.prisma.distribution.findUnique({
            where: { id: distributionId },
            include: {
                post: {
                    include: {
                        versions: {
                            include: { videoAsset: true },
                        },
                    },
                },
            },
        });
        
        if (!dist) {
            throw new Error(`Distribution ${distributionId} not found`);
        }
        
        const { platform, post } = dist;
        const activeVersion = post.versions.find(v => v.id === post.active_version_id);
        
        if (!activeVersion || !activeVersion.videoAsset) {
            await this.prisma.distribution.update({
                where: { id: distributionId },
                data: {
                    status: 'FAILED',
                    error: 'No active video version found',
                },
            });
            return;
        }

        const videoUrl = activeVersion.videoAsset.mp4_url;
        
        try {
            console.log(`[Distribution] Processing distribution to ${platform} for post ${post.id}`);
            
            // Get platform configuration
            const settings = await this.prisma.settings.findFirst();
            if (!settings) {
                throw new Error('Settings not configured');
            }

            let result;
            
            switch (platform) {
                case 'facebook':
                    if (!settings.social_facebook_config) {
                        throw new Error('Facebook not configured');
                    }
                    result = await this.facebookService.publishToFacebook(
                        JSON.parse(settings.social_facebook_config),
                        post,
                        videoUrl
                    );
                    break;

                case 'instagram':
                    if (!settings.social_facebook_config) {
                        throw new Error('Instagram not configured');
                    }
                    result = await this.facebookService.publishToInstagram(
                        JSON.parse(settings.social_facebook_config),
                        post,
                        videoUrl
                    );
                    break;

                case 'youtube':
                    if (!settings.social_youtube_config) {
                        throw new Error('YouTube not configured');
                    }
                    result = await this.youtubeService.publishToYoutube(
                        JSON.parse(settings.social_youtube_config),
                        post,
                        videoUrl
                    );
                    break;

                case 'tiktok':
                    if (!settings.social_tiktok_config) {
                        throw new Error('TikTok not configured');
                    }
                    result = await this.tiktokService.publishToTiktok(
                        JSON.parse(settings.social_tiktok_config),
                        post,
                        videoUrl
                    );
                    break;

                case 'twitter':
                    if (!settings.social_twitter_config) {
                        throw new Error('Twitter not configured');
                    }
                    result = await this.twitterService.publishToTwitter(
                        JSON.parse(settings.social_twitter_config),
                        post,
                        videoUrl
                    );
                    break;

                default:
                    throw new Error(`Unknown platform: ${platform}`);
            }
            
            await this.prisma.distribution.update({
                where: { id: distributionId },
                data: {
                    status: 'POSTED',
                    posted_at: new Date(),
                    platform_id: result.platform_id,
                    platform_url: result.platform_url,
                },
            });
            
            console.log(`[Distribution] Successfully posted to ${platform}: ${result.platform_url}`);
        } catch (err) {
            console.error(`[Distribution] Failed to post to ${platform}:`, err);
            await this.prisma.distribution.update({
                where: { id: distributionId },
                data: {
                    status: 'FAILED',
                    error: err.message,
                },
            });
        }
    }

    async webhookCallback(platform, data) {
        console.log(`[Distribution] Webhook callback from ${platform}:`, data);
        return { success: true };
    }
};
exports.DistributionService = DistributionService;
exports.DistributionService = DistributionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [
        prisma_service_1.PrismaService,
        social_facebook_service_1.SocialFacebookService,
        social_youtube_service_1.SocialYoutubeService,
        social_tiktok_service_1.SocialTiktokService,
        social_twitter_service_1.SocialTwitterService
    ])
], DistributionService);
//# sourceMappingURL=distribution.service.js.map
