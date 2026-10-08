import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../llm/llm.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async getRecommendations(applicantId: string) {
    return this.prisma.recommendation.findMany({
      where: { applicantId },
      orderBy: { priority: 'asc' },
    });
  }

  async createConsultantReferral(
    applicantId: string,
    notes?: string,
    slotRequestedAt?: Date,
  ) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        personal: true,
        educations: true,
        languages: true,
        qualificationResults: { take: 1, orderBy: { computedAt: 'desc' } },
      },
    });

    if (!applicant) throw new NotFoundException('Applicant not found');

    // Find first consultant
    const consultant = await this.prisma.user.findFirst({
      where: { role: 'CONSULTANT' },
    });

    // Generate AI Handoff Summary
    const summaryPrompt = `Generate a concise 3-sentence executive handoff summary for a German education consultant about this applicant:
Name: ${applicant.personal?.name || 'Applicant'}
Goal: ${applicant.goal}
Education: ${applicant.educations?.[0]?.degree || 'N/A'}
Languages: ${applicant.languages?.map((l) => `${l.language}: ${l.cefrLevel}`).join(', ') || 'N/A'}
Score: ${applicant.qualificationResults?.[0]?.score || 'N/A'}`;

    const summaryResult = await this.llm.generateText(summaryPrompt);

    return this.prisma.consultantReferral.create({
      data: {
        applicantId,
        consultantId: consultant?.id,
        slotRequestedAt: slotRequestedAt || new Date(Date.now() + 48 * 3600 * 1000),
        status: 'PENDING',
        handoffSummary: summaryResult.text,
        notes: notes || 'Booked through Educaro Compass portal',
      },
    });
  }
}
