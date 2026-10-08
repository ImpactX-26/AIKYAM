import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  LlmProvider,
  LlmMediaInput,
  StructuredResult,
  TranscriptionResult,
} from './llm.interface';

@Injectable()
export class MockProvider implements LlmProvider {
  name = 'MockProvider';
  private readonly logger = new Logger(MockProvider.name);

  async generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{ text: string; tokenUsage?: any }> {
    this.logger.debug(`[MockProvider] generateText received prompt`);

    if (prompt.includes('summary') || prompt.includes('Lebenslauf')) {
      return {
        text: 'Dedicated professional seeking to expand qualifications and build a technical career in Germany through structured academic study and industrial application.',
        tokenUsage: { promptTokens: 120, completionTokens: 30, totalTokens: 150 },
      };
    }

    return {
      text: 'Based on your profile facts and submitted credentials, you are on track for German pathway evaluation.',
      tokenUsage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
    };
  }

  async generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    systemPrompt?: string,
    media?: LlmMediaInput[],
  ): Promise<StructuredResult<T>> {
    this.logger.debug(`[MockProvider] generateStructured invoked for schema`);

    // 1. Document Extraction Mock
    if (prompt.includes('document') || prompt.includes('OCR') || prompt.includes('classify')) {
      let mockData: any = {
        documentType: 'DEGREE',
        classifiedConfidence: 0.98,
        fields: [
          {
            fieldPath: 'education.degree',
            value: 'Bachelor of Technology',
            confidence: 0.98,
            pageNumber: 1,
            bbox: { x: 100, y: 150, width: 300, height: 40 },
          },
          {
            fieldPath: 'education.institution',
            value: 'Savitribai Phule Pune University',
            confidence: 0.96,
            pageNumber: 1,
            bbox: { x: 80, y: 80, width: 400, height: 50 },
          },
          {
            fieldPath: 'personal.name',
            value: 'Aarav Sharma',
            confidence: 0.99,
            pageNumber: 1,
            bbox: { x: 150, y: 220, width: 200, height: 35 },
          },
        ],
      };

      if (prompt.includes('A2') || prompt.includes('language') || prompt.includes('Goethe')) {
        mockData = {
          documentType: 'LANGUAGE_CERT',
          classifiedConfidence: 0.99,
          fields: [
            {
              fieldPath: 'languages.language',
              value: 'German',
              confidence: 0.99,
              pageNumber: 1,
            },
            {
              fieldPath: 'languages.cefrLevel',
              value: 'A2',
              confidence: 0.98,
              pageNumber: 1,
            },
            {
              fieldPath: 'languages.certificateName',
              value: 'Goethe-Zertifikat A2',
              confidence: 0.97,
              pageNumber: 1,
            },
          ],
        };
      }

      try {
        const validated = schema.parse(mockData);
        return {
          data: validated,
          rawText: JSON.stringify(mockData),
          tokenUsage: { promptTokens: 250, completionTokens: 120, totalTokens: 370 },
        };
      } catch {
        // Fallback to minimal schema parse
      }
    }

    // 2. Orchestrator Next Action Mock
    if (prompt.includes('Orchestrator') || prompt.includes('next action') || prompt.includes('gap')) {
      const mockAction: any = {
        thoughtSummary:
          'Applicant has defined their goal as STUDY in Germany. We have their Bachelor credentials, but need to check their current German or English language proficiency.',
        action: 'ask_user',
        toolName: 'ask_user',
        toolInput: {
          question:
            'What is your current German language proficiency level according to the CEFR scale?',
          explanation:
            'German public universities and visa processing require certified language proof (typically B1/B2 for German-taught, or English proof with basic A1 German).',
          quickReplies: [
            'No German yet (Beginner)',
            'A1 - Basic phrases',
            'A2 - Elementary',
            'B1 - Intermediate',
            'B2 - Advanced / University Ready',
          ],
          uiDirective: {
            type: 'CEFR_SELECTOR',
            targetField: 'languages.cefrLevel',
            options: ['A1', 'A2', 'B1', 'B2', 'C1'],
          },
        },
      };

      try {
        const validated = schema.parse(mockAction);
        return {
          data: validated,
          rawText: JSON.stringify(mockAction),
          tokenUsage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 },
        };
      } catch {
        // Fallback
      }
    }

    // 3. Fallback generic structured response
    const generic: any = {
      summary: 'Processed successfully by Educaro Compass AI agent.',
      insights: ['Profile gap identified', 'Recommendation synthesized'],
    };
    return {
      data: generic as T,
      rawText: JSON.stringify(generic),
      tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    };
  }

  async transcribe(
    mediaBuffer: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResult> {
    this.logger.debug(`[MockProvider] transcribe called for ${mimeType}`);
    return {
      transcript:
        'Hello Educaro team! My name is Aarav. I completed my B.Tech in Computer Engineering in India. My dream is to pursue a Master’s degree in Germany, specifically in Robotics or Embedded Systems. I have started learning German and am motivated to study and build a career in Deutschland.',
      segments: [
        {
          start: 0.0,
          end: 4.5,
          text: 'Hello Educaro team! My name is Aarav.',
        },
        {
          start: 4.8,
          end: 9.2,
          text: 'I completed my B.Tech in Computer Engineering in India.',
        },
        {
          start: 9.5,
          end: 15.0,
          text: 'My dream is to pursue a Master’s degree in Germany, specifically in Robotics or Embedded Systems.',
        },
        {
          start: 15.3,
          end: 22.0,
          text: 'I have started learning German and am motivated to study and build a career in Deutschland.',
        },
      ],
    };
  }
}
