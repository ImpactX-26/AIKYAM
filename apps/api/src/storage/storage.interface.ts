import { Readable } from 'stream';

export interface StorageService {
  saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subDir?: string,
  ): Promise<{ storageKey: string; publicUrl: string; sizeBytes: number }>;

  getFileStream(storageKey: string): Promise<{ stream: Readable; mimeType: string }>;

  getUrl(storageKey: string): string;

  deleteFile(storageKey: string): Promise<boolean>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
