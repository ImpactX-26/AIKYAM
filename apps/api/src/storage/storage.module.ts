import { Module, Global } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';
import { STORAGE_SERVICE } from './storage.interface';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      useExisting: LocalStorageService,
    },
  ],
  exports: [LocalStorageService, STORAGE_SERVICE],
})
export class StorageModule {}
