import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../../storage/local-storage.service';
import { LlmService } from '../../llm/llm.service';
import { VIDEO_ANALYSIS_PROMPT } from '../../agents/prompts/system.prompts';
import { MediaType } from '@prisma/client';
import { z } from 'zod';

const VideoInsightsSchema = z.object({
  backgroundSummary: z.string(),
  motivationForGermany: z.string(),
  longTermGoals: z.string(),
  languagesHeard: z.array(z.string()).default(['English']),
  keyStrengths: z.array(z.string()).default([]),
});

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly llm: LlmService,
  ) {}

  async processIntroVideo(applicantId: string, file: Express.Multer.File) {
    const saved = await this.storage.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'videos',
    );

    // Transcribe audio from video
    const transcription = await this.llm.transcribe(file.buffer, file.mimetype);

    // Extract insights from transcript
    const insightsResult = await this.llm.generateStructured(
      VideoInsightsSchema,
      `Analyze this applicant introduction transcript:\n\n"${transcription.transcript}"`,
      VIDEO_ANALYSIS_PROMPT,
    );

    const media = await this.prisma.media.create({
      data: {
        applicantId,
        type: MediaType.INTRO_VIDEO,
        storageKey: saved.storageKey,
        durationSec: transcription.segments.length > 0 ? transcription.segments[transcription.segments.length - 1].end : 30,
        transcript: transcription.transcript,
        transcriptSegments: transcription.segments as any,
        extractedInsights: insightsResult.data as any,
        status: 'PROCESSED',
      },
    });

    return media;
  }

  async getMedia(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new NotFoundException('Media record not found');
    return media;
  }
}
