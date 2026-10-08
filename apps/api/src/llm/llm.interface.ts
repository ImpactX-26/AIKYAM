import { z } from 'zod';

export interface LlmMediaInput {
  mimeType: string;
  buffer: Buffer;
}

export interface StructuredResult<T> {
  data: T;
  rawText: string;
  tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  transcript: string;
  segments: TranscriptionSegment[];
}

export interface LlmProvider {
  name: string;

  generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{ text: string; tokenUsage?: any }>;

  generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    systemPrompt?: string,
    media?: LlmMediaInput[],
  ): Promise<StructuredResult<T>>;

  transcribe(
    mediaBuffer: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResult>;
}

export const LLM_PROVIDER = 'LLM_PROVIDER';
