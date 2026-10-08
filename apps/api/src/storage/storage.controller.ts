import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { LocalStorageService } from './local-storage.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: LocalStorageService) {}

  @Get(':folder/:fileName')
  @ApiOperation({ summary: 'Stream or download uploaded document/video' })
  async getFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const storageKey = `${folder}/${fileName}`;
      const { stream, mimeType } = await this.storageService.getFileStream(storageKey);
      res.setHeader('Content-Type', mimeType);
      stream.pipe(res);
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}
