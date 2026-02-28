import { Controller, Post, Get, Delete, Body, HttpCode } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('vapid-key')
  getVapidKey() {
    return {
      publicKey: this.notificationsService.getVapidPublicKey(),
    };
  }

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(
    @Body()
    body: {
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      userId?: string;
      categories?: string[];
    }
  ) {
    const result = await this.notificationsService.subscribe({
      endpoint: body.subscription.endpoint,
      keys: body.subscription.keys,
      userId: body.userId,
      categories: body.categories,
    });

    return { success: true, id: result.id };
  }

  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.notificationsService.unsubscribe(body.endpoint);
    return { success: true };
  }

  @Post('test')
  @HttpCode(200)
  async testNotification(
    @Body()
    body: {
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      title: string;
      body: string;
    }
  ) {
    const result = await this.notificationsService.sendPushNotification(
      {
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
      },
      { title: body.title, body: body.body }
    );

    return result;
  }
}
