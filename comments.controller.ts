import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('feed/:postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const comments = await this.commentsService.getCommentsByPost(
      postId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0
    );

    return { comments };
  }

  @Post('feed/:postId/comments')
  @HttpCode(200)
  async createComment(
    @Param('postId') postId: string,
    @Body() body: { content: string; parent_id?: string },
    @Request() req: any
  ) {
    // Get user from public auth (if available)
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    const comment = await this.commentsService.createComment(
      postId,
      userId,
      body.content,
      body.parent_id
    );

    return comment;
  }

  @Post('feed/comments/:id/like')
  @HttpCode(200)
  async likeComment(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    const result = await this.commentsService.likeComment(id, userId);
    return result;
  }

  @Post('feed/comments/:id/report')
  @HttpCode(200)
  async reportComment(@Param('id') id: string) {
    const result = await this.commentsService.reportComment(id);
    return result;
  }

  @Delete('feed/comments/:id')
  async deleteComment(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    const result = await this.commentsService.deleteComment(id, userId);
    return result;
  }

  @Get('admin/comments/reported')
  async getReportedComments() {
    const comments = await this.commentsService.getReportedComments();
    return { comments };
  }

  @Delete('admin/comments/:id')
  async adminDeleteComment(@Param('id') id: string) {
    const result = await this.commentsService.adminDeleteComment(id);
    return result;
  }
}
