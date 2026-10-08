import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  LlmProvider,
  LlmMediaInput,
  StructuredResult,
  TranscriptionResult,
} from './llm.interface';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';

@Injectable()
export class LlmService implements LlmProvider {
  name = 'LlmService';
  private readonly logger = new Logger(LlmService.name);
  private activeProvider: LlmProvider;

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly mockProvider: MockProvider,
  ) {
    const isDemoMode = process.env.DEMO_MODE === 'true';
    const hasGeminiKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

    if (!isDemoMode && hasGeminiKey && this.geminiProvider.isAvailable()) {
      this.activeProvider = this.geminiProvider;
      this.logger.log('🚀 Using GeminiProvider for LLM capabilities.');
    } else {
      this.activeProvider = this.mockProvider;
      this.logger.log(
        `⚡ Using MockProvider (Deterministic offline fixtures. DemoMode=${isDemoMode})`,
      );
    }
  }

  getActiveProviderName(): string {
    return this.activeProvider.name;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{ text: string; tokenUsage?: any }> {
    try {
      return await this.activeProvider.generateText(prompt, systemPrompt);
    } catch (error: any) {
      this.logger.warn(
        `LLM generateText failed with ${this.activeProvider.name}: ${error.message}. Falling back to MockProvider.`,
      );
      return await this.mockProvider.generateText(prompt, systemPrompt);
    }
  }

  async generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    systemPrompt?: string,
    media?: LlmMediaInput[],
  ): Promise<StructuredResult<T>> {
    try {
      return await this.activeProvider.generateStructured(schema, prompt, systemPrompt, media);
    } catch (error: any) {
      this.logger.warn(
        `LLM generateStructured failed with ${this.activeProvider.name}: ${error.message}. Falling back to MockProvider.`,
      );
      return await this.mockProvider.generateStructured(schema, prompt, systemPrompt, media);
    }
  }

  async transcribe(
    mediaBuffer: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResult> {
    try {
      return await this.activeProvider.transcribe(mediaBuffer, mimeType);
    } catch (error: any) {
      this.logger.warn(
        `LLM transcribe failed with ${this.activeProvider.name}: ${error.message}. Falling back to MockProvider.`,
      );
      return await this.mockProvider.transcribe(mediaBuffer, mimeType);
    }
  }
}
