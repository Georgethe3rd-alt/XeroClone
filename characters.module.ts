import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Service } from '../providers/storage/s3.service';

@Module({
  imports: [PrismaModule],
  controllers: [CharactersController],
  providers: [CharactersService, S3Service],
  exports: [CharactersService],
})
export class CharactersModule {}
