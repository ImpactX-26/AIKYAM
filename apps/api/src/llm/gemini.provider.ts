import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import {
  LlmProvider,
  LlmMediaInput,
  StructuredResult,
  TranscriptionResult,
} from './llm.interface';

@Injectable()
export class GeminiProvider implements LlmProvider {
  name = 'GeminiProvider';
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{ text: string; tokenUsage?: any }> {
    if (!this.client) {
      throw new Error('GeminiProvider: GEMINI_API_KEY is not configured.');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      text: response.text(),
      tokenUsage: response.usageMetadata,
    };
  }

  async generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    systemPrompt?: string,
    media?: LlmMediaInput[],
  ): Promise<StructuredResult<T>> {
    if (!this.client) {
      throw new Error('GeminiProvider: GEMINI_API_KEY is not configured.');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction:
        (systemPrompt || '') +
        '\n\nCRITICAL: Return valid JSON matching the expected format exactly. Never invent facts.',
    });

    const contents: any[] = [];
    if (media && media.length > 0) {
      for (const m of media) {
        contents.push({
          inlineData: {
            data: m.buffer.toString('base64'),
            mimeType: m.mimeType,
          },
        });
      }
    }
    contents.push(prompt);

    const result = await model.generateContent(contents);
    const rawText = result.response.text();

    try {
      const parsedJson = JSON.parse(rawText);
      const validatedData = schema.parse(parsedJson);
      return {
        data: validatedData,
        rawText,
        tokenUsage: result.response.usageMetadata
          ? {
              promptTokens: result.response.usageMetadata.promptTokenCount,
              completionTokens: result.response.usageMetadata.candidatesTokenCount,
              totalTokens: result.response.usageMetadata.totalTokenCount,
            }
          : undefined,
      };
    } catch (parseError: any) {
      this.logger.error(`Structured validation failed: ${parseError.message}`);
      throw new Error(`Gemini structured response schema validation failed: ${parseError.message}`);
    }
  }

  async transcribe(
    mediaBuffer: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResult> {
    if (!this.client) {
      throw new Error('GeminiProvider: GEMINI_API_KEY is not configured.');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction:
        'You are an expert audio transcription system. Transcribe the audio precisely. Return JSON with format: {"transcript": string, "segments": [{"start": number, "end": number, "text": string}]}',
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: mediaBuffer.toString('base64'),
          mimeType,
        },
      },
      'Transcribe this audio recording into English with accurate timestamps and speaker text.',
    ]);

    const json = JSON.parse(result.response.text());
    return {
      transcript: json.transcript || '',
      segments: json.segments || [],
    };
  }
}
