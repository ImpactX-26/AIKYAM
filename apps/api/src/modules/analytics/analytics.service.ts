import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentRunTrace(runId: string) {
    const run = await this.prisma.agentRun.findUnique({
      where: { id: runId },
      include: {
        steps: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!run) throw new NotFoundException('Agent run not found');
    return run;
  }

  async getFunnelStats() {
    const totalApplicants = await this.prisma.applicant.count();
    const byGoal = await this.prisma.applicant.groupBy({
      by: ['goal'],
      _count: { id: true },
    });

    const qualBreakdown = await this.prisma.qualificationResult.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const totalReferrals = await this.prisma.consultantReferral.count();
    const openTasks = await this.prisma.clarificationTask.count({
      where: { status: 'OPEN' },
    });

    return {
      totalApplicants,
      byGoal: byGoal.map((g) => ({ goal: g.goal, count: g._count.id })),
      qualificationDistribution: qualBreakdown.map((q) => ({
        status: q.status,
        count: q._count.id,
      })),
      totalConsultantReferrals: totalReferrals,
      openClarificationTasks: openTasks,
    };
  }

  async getConsultantApplicants() {
    return this.prisma.applicant.findMany({
      include: {
        personal: true,
        user: { select: { email: true, createdAt: true } },
        qualificationResults: { take: 1, orderBy: { computedAt: 'desc' } },
        clarificationTasks: { where: { status: 'OPEN' } },
        recommendations: { take: 1, orderBy: { priority: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConsultantApplicantDetail(applicantId: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        user: true,
        personal: true,
        educations: true,
        employments: true,
        languages: true,
        skills: true,
        documents: { include: { extractions: true } },
        media: true,
        profileFacts: true,
        clarificationTasks: true,
        qualificationResults: true,
        recommendations: true,
        consultantReferrals: true,
        agentRuns: {
          include: { steps: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!applicant) throw new NotFoundException('Applicant not found');
    return applicant;
  }
}
