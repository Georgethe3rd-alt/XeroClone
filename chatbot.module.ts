import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
