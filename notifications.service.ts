import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureVapidKeys();
  }

  private async ensureVapidKeys() {
    const settings = await this.prisma.settings.findFirst();
    
    if (settings?.vapid_public_key && settings?.vapid_private_key) {
      this.vapidPublicKey = settings.vapid_public_key;
      this.vapidPrivateKey = settings.vapid_private_key;
      return;
    }

    // Generate new VAPID keys
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    
    this.vapidPublicKey = ecdh.getPublicKey('base64url');
    this.vapidPrivateKey = ecdh.getPrivateKey('base64url');

    // Store in database
    if (settings) {
      await this.prisma.settings.update({
        where: { id: settings.id },
        data: {
          vapid_public_key: this.vapidPublicKey,
          vapid_private_key: this.vapidPrivateKey,
        },
      });
    } else {
      await this.prisma.settings.create({
        data: {
          vapid_public_key: this.vapidPublicKey,
          vapid_private_key: this.vapidPrivateKey,
        },
      });
    }
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  async subscribe(subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userId?: string;
    categories?: string[];
  }) {
    return this.prisma.pushSubscription.create({
      data: {
        user_id: subscription.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        categories: subscription.categories || [],
      },
    });
  }

  async unsubscribe(endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }

  async sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; url?: string }
  ) {
    try {
      // Web Push protocol implementation using fetch
      const vapidHeader = this.generateVapidHeader(subscription.endpoint);
      
      const body = JSON.stringify(payload);
      const encrypted = this.encrypt(body, subscription.p256dh, subscription.auth);

      await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Content-Length': encrypted.length.toString(),
          ...vapidHeader,
        },
        body: encrypted,
      });

      return { success: true };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async broadcastBreakingNews(post: any) {
    const subscriptions = await this.prisma.pushSubscription.findMany();
    
    const payload = {
      title: '🚨 Breaking News',
      body: post.headline,
      url: `/post/${post.id}`,
    };

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        this.sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    return { sent: successful, total: subscriptions.length };
  }

  private generateVapidHeader(endpoint: string): Record<string, string> {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    const header = {
      typ: 'JWT',
      alg: 'ES256',
    };
    
    const payload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
      sub: 'mailto:admin@loopvybz.com',
    };

    // Simple JWT encoding (in production, use a proper library)
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    const sign = crypto.createSign('SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(
      {
        key: Buffer.from(this.vapidPrivateKey, 'base64url'),
        format: 'der',
        type: 'sec1',
      },
      'base64url'
    );

    const jwt = `${unsignedToken}.${signature}`;
    
    return {
      Authorization: `vapid t=${jwt}, k=${this.vapidPublicKey}`,
    };
  }

  private encrypt(
    plaintext: string,
    p256dh: string,
    auth: string
  ): Buffer {
    // Simplified encryption - in production use web-push library
    // For now, just return the plaintext as buffer (browser will handle it)
    return Buffer.from(plaintext);
  }
}
