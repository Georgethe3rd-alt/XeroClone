import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from '../providers/storage/s3.service';

@Controller('admin/characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  findAll(@Query('role') role?: string) {
    return this.charactersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Post()
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.charactersService.create(createCharacterDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.charactersService.remove(id);
  }

  @Post(':id/upload')
  async uploadImage(@Param('id') id: string, @Body() body: { url: string }) {
    return this.charactersService.addImage(id, body.url);
  }

  @Post(':id/upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImageFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const key = `characters/${id}/${Date.now()}-${file.originalname}`;
    const url = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
    return this.charactersService.addImage(id, url);
  }
}
