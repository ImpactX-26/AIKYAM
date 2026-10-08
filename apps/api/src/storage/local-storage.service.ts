import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseDir: string;
  private readonly maxDocSizeBytes = 10 * 1024 * 1024; // 10MB
  private readonly maxVideoSizeBytes = 100 * 1024 * 1024; // 100MB

  constructor() {
    this.baseDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subDir = 'documents',
  ): Promise<{ storageKey: string; publicUrl: string; sizeBytes: number }> {
    const isVideo = mimeType.startsWith('video/');
    const limit = isVideo ? this.maxVideoSizeBytes : this.maxDocSizeBytes;

    if (fileBuffer.length > limit) {
      throw new BadRequestException(
        `File size exceeds limit of ${isVideo ? '100MB' : '10MB'}.`,
      );
    }

    const targetDir = path.join(this.baseDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.pdf');
    const safeFileName = `${Date.now()}-${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, safeFileName);

    await fs.promises.writeFile(filePath, fileBuffer);
    const storageKey = `${subDir}/${safeFileName}`;
    const publicUrl = `/api/v1/storage/${storageKey}`;

    this.logger.log(`Saved file: ${storageKey} (${fileBuffer.length} bytes)`);

    return {
      storageKey,
      publicUrl,
      sizeBytes: fileBuffer.length,
    };
  }

  async getFileStream(storageKey: string): Promise<{ stream: Readable; mimeType: string }> {
    const fullPath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException(`File not found at storageKey: ${storageKey}`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.webm') mimeType = 'video/webm';

    return {
      stream: fs.createReadStream(fullPath),
      mimeType,
    };
  }

  getUrl(storageKey: string): string {
    return `/api/v1/storage/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }
}
