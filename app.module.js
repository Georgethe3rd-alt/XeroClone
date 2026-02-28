"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const serve_static_1 = require("@nestjs/serve-static");
const path = require("path");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const sources_module_1 = require("./sources/sources.module");
const settings_module_1 = require("./settings/settings.module");
const stories_module_1 = require("./stories/stories.module");
const posts_module_1 = require("./posts/posts.module");
const ingestion_module_1 = require("./ingestion/ingestion.module");
const generation_module_1 = require("./generation/generation.module");
const feed_module_1 = require("./feed/feed.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const characters_module_1 = require("./characters/characters.module");
const chatbot_module_1 = require("./chatbot/chatbot.module");
const scheduling_module_1 = require("./scheduling/scheduling.module");
const analytics_module_1 = require("./analytics/analytics.module");
const distribution_module_1 = require("./distribution/distribution.module");
const public_auth_module_1 = require("./public-auth/public-auth.module");
const engagement_module_1 = require("./engagement/engagement.module");
const ads_module_1 = require("./ads/ads.module");
const notifications_module_1 = require("./notifications/notifications.module");
const comments_module_1 = require("./comments/comments.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const contributors_module_1 = require("./contributors/contributors.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const social_module_1 = require("./social/social.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            bull_1.BullModule.forRoot({
                redis: process.env.REDIS_URL || 'redis://localhost:6379',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: path.join(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            sources_module_1.SourcesModule,
            settings_module_1.SettingsModule,
            stories_module_1.StoriesModule,
            posts_module_1.PostsModule,
            ingestion_module_1.IngestionModule,
            generation_module_1.GenerationModule,
            feed_module_1.FeedModule,
            dashboard_module_1.DashboardModule,
            characters_module_1.CharactersModule,
            chatbot_module_1.ChatbotModule,
            scheduling_module_1.SchedulingModule,
            analytics_module_1.AnalyticsModule,
            distribution_module_1.DistributionModule,
            public_auth_module_1.PublicAuthModule,
            engagement_module_1.EngagementModule,
            ads_module_1.AdsModule,
            notifications_module_1.NotificationsModule,
            comments_module_1.CommentsModule,
            recommendations_module_1.RecommendationsModule,
            contributors_module_1.ContributorsModule,
            subscriptions_module_1.SubscriptionsModule,
            social_module_1.SocialModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
