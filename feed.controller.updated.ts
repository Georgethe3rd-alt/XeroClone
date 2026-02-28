import { Controller, Get, Param, Query } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get('feed')
  getFeed(
    @Query('cursor') cursor?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('q') q?: string,
    @Query('limit') limit = '10',
  ) {
    return this.feedService.getFeed({ cursor, category, region, q, limit: parseInt(limit) });
  }

  @Get('feed/regions')
  getRegions() {
    return this.feedService.getRegions();
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.feedService.getPost(id);
  }
}
