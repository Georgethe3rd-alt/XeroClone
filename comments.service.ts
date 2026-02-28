import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getCommentsByPost(postId: string, limit = 50, offset = 0) {
    const comments = await this.prisma.comment.findMany({
      where: { post_id: postId, parent_id: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      like_count: c.like_count,
      created_at: c.created_at,
      user: c.user
        ? {
            id: c.user.id,
            name: c.user.name || 'Anonymous',
            avatar_url: c.user.avatar_url,
          }
        : { id: null, name: 'Anonymous', avatar_url: '' },
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        like_count: r.like_count,
        created_at: r.created_at,
        user: r.user
          ? {
              id: r.user.id,
              name: r.user.name || 'Anonymous',
              avatar_url: r.user.avatar_url,
            }
          : { id: null, name: 'Anonymous', avatar_url: '' },
      })),
    }));
  }

  async createComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string
  ) {
    const comment = await this.prisma.comment.create({
      data: {
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Increment comment count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: { comment_count: { increment: 1 } },
    });

    return {
      id: comment.id,
      content: comment.content,
      like_count: comment.like_count,
      created_at: comment.created_at,
      user: comment.user
        ? {
            id: comment.user.id,
            name: comment.user.name || 'Anonymous',
            avatar_url: comment.user.avatar_url,
          }
        : { id: null, name: 'Anonymous', avatar_url: '' },
    };
  }

  async likeComment(commentId: string, userId: string) {
    // Simple toggle - in production, track individual likes
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // For now, just increment - improve with user tracking later
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { like_count: { increment: 1 } },
    });

    return { liked: true };
  }

  async reportComment(commentId: string) {
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { reported: true },
    });

    return { success: true };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Decrement comment count on post
    await this.prisma.post.update({
      where: { id: comment.post_id },
      data: { comment_count: { decrement: 1 } },
    });

    return { success: true };
  }

  async getReportedComments() {
    return this.prisma.comment.findMany({
      where: { reported: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            headline: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async adminDeleteComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Decrement comment count on post
    await this.prisma.post.update({
      where: { id: comment.post_id },
      data: { comment_count: { decrement: 1 } },
    });

    return { success: true };
  }
}
