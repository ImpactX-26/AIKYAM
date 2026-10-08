import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { evaluateQualification, simulateWhatIf } from '../../deterministic/qualification';
import { Pathway } from '@prisma/client';

@Injectable()
export class QualificationService {
  constructor(private readonly prisma: PrismaService) {}

  async runQualification(applicantId: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        personal: true,
        educations: true,
        employments: true,
        languages: true,
        documents: true,
      },
    });

    if (!applicant) throw new NotFoundException('Applicant not found');

    const pathway = (applicant.goal === 'UNDECIDED' ? 'STUDY' : applicant.goal) as Pathway;

    const ruleSet = await this.prisma.qualificationRuleSet.findFirst({
      where: { pathway, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!ruleSet) throw new NotFoundException(`No active rule set for pathway: ${pathway}`);

    const outcome = evaluateQualification(pathway, ruleSet.rulesJson, applicant);

    return this.prisma.qualificationResult.create({
      data: {
        applicantId,
        ruleSetId: ruleSet.id,
        pathway,
        status: outcome.status,
        score: outcome.score,
        breakdown: outcome.breakdown as any,
        missingRequirements: outcome.missingRequirements as any,
        explanation: outcome.explanation,
      },
    });
  }

  async getLatestResult(applicantId: string) {
    const result = await this.prisma.qualificationResult.findFirst({
      where: { applicantId },
      orderBy: { computedAt: 'desc' },
      include: { ruleSet: true },
    });

    if (!result) {
      // Run on the fly if not yet computed
      return this.runQualification(applicantId);
    }

    return result;
  }

  async simulateChanges(
    applicantId: string,
    modifications: {
      germanLevel?: string;
      englishLevel?: string;
      yearsOfExperience?: number;
      hasAps?: boolean;
    },
  ) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        personal: true,
        educations: true,
        employments: true,
        languages: true,
        documents: true,
      },
    });

    if (!applicant) throw new NotFoundException('Applicant not found');

    const pathway = (applicant.goal === 'UNDECIDED' ? 'STUDY' : applicant.goal) as Pathway;

    const ruleSet = await this.prisma.qualificationRuleSet.findFirst({
      where: { pathway, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!ruleSet) throw new NotFoundException(`No active rule set for pathway: ${pathway}`);

    return simulateWhatIf(pathway, ruleSet.rulesJson, applicant, modifications);
  }
}
