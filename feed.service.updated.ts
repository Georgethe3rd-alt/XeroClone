import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getFeed({ cursor, category, region, q, limit = 10 }: {
    cursor?: string;
    category?: string;
    region?: string;
    q?: string;
    limit?: number;
  }) {
    const take = Math.min(limit, 50);
    const where: any = { status: 'LIVE', active_version_id: { not: null } };
    if (category) where.category = category;
    if (region) where.region = region;
    if (q) {
      where.OR = [
        { headline: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        story: { select: { source_url: true } },
        versions: {
          where: { status: 'COMPLETED' },
          include: { videoAsset: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { published_at_live: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const feed = items
      .filter((p) => {
        const activeVersion = p.versions.find((v) => v.id === p.active_version_id) || p.versions[0];
        return activeVersion?.videoAsset;
      })
      .map((p) => {
        const activeVersion = p.versions.find((v) => v.id === p.active_version_id) || p.versions[0];
        const asset = activeVersion?.videoAsset;
        return {
          id: p.id,
          headline: p.headline,
          caption: p.caption,
          category: p.category,
          tags: p.tags,
          tone: p.tone,
          region: p.region,
          published_at_live: p.published_at_live,
          source_url: p.story?.source_url || '',
          mp4_url: asset?.mp4_url || '',
          thumb_url: asset?.thumb_url || '',
          captions_url: asset?.captions_url || null,
          duration_seconds: asset?.duration_seconds || 15,
          view_count: p.view_count,
          like_count: p.like_count,
          share_count: p.share_count,
          save_count: p.save_count,
          comment_count: p.comment_count,
        };
      });

    return { items: feed, next_cursor: nextCursor, total: feed.length };
  }

  async getRegions() {
    const regions = await this.prisma.post.findMany({
      where: { status: 'LIVE', region: { not: '' } },
      select: { region: true },
      distinct: ['region'],
    });

    const regionList = regions.map((r) => r.region).filter(Boolean);
    return {
      regions: ['All Caribbean', ...regionList],
    };
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id, status: 'LIVE' },
      include: {
        story: { select: { source_url: true } },
        versions: {
          where: { status: 'COMPLETED' },
          include: { videoAsset: true },
          take: 1,
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const version = post.versions[0];
    const asset = version?.videoAsset;

    return {
      id: post.id,
      headline: post.headline,
      caption: post.caption,
      category: post.category,
      tags: post.tags,
      tone: post.tone,
      region: post.region,
      published_at_live: post.published_at_live,
      source_url: post.story?.source_url || '',
      mp4_url: asset?.mp4_url || '',
      thumb_url: asset?.thumb_url || '',
      captions_url: asset?.captions_url || null,
      duration_seconds: asset?.duration_seconds || 15,
      view_count: post.view_count,
      like_count: post.like_count,
      share_count: post.share_count,
      save_count: post.save_count,
      comment_count: post.comment_count,
    };
  }
}
