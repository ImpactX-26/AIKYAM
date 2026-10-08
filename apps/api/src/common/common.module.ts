import { Global, Module } from '@nestjs/common';
import { SseHubService } from './sse/sse-hub.service';

@Global()
@Module({
  providers: [SseHubService],
  exports: [SseHubService],
})
export class CommonModule {}
