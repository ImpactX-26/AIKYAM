import { Module, Global } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';
import { LlmService } from './llm.service';
import { LLM_PROVIDER } from './llm.interface';

@Global()
@Module({
  providers: [
    GeminiProvider,
    MockProvider,
    LlmService,
    {
      provide: LLM_PROVIDER,
      useExisting: LlmService,
    },
  ],
  exports: [LlmService, LLM_PROVIDER],
})
export class LlmModule {}
