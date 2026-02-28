import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SourcesModule } from './sources/sources.module';
import { SettingsModule } from './settings/settings.module';
import { StoriesModule } from './stories/stories.module';
import { PostsModule } from './posts/posts.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { GenerationModule } from './generation/generation.module';
import { FeedModule } from './feed/feed.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CharactersModule } from './characters/characters.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DistributionModule } from './distribution/distribution.module';
import { PublicAuthModule } from './public-auth/public-auth.module';
import { EngagementModule } from './engagement/engagement.module';
import { AdsModule } from './ads/ads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    SourcesModule,
    SettingsModule,
    StoriesModule,
    PostsModule,
    IngestionModule,
    GenerationModule,
    FeedModule,
    DashboardModule,
    CharactersModule,
    ChatbotModule,
    SchedulingModule,
    AnalyticsModule,
    DistributionModule,
    PublicAuthModule,
    EngagementModule,
    AdsModule,
    NotificationsModule,
    CommentsModule,
  ],
})
export class AppModule {}
