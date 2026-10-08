import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicValidation } from '../../deterministic/validation';
import { ClarificationStatus } from '@prisma/client';

@Injectable()
export class ValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async runValidation(applicantId: string) {
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

    const issues = runDeterministicValidation({
      goal: applicant.goal,
      personal: applicant.personal,
      educations: applicant.educations,
      employments: applicant.employments,
      languages: applicant.languages,
      documents: applicant.documents,
    });

    const tasks = [];
    for (const issue of issues) {
      const existing = await this.prisma.clarificationTask.findFirst({
        where: {
          applicantId,
          message: issue.message,
          status: ClarificationStatus.OPEN,
        },
      });

      if (!existing) {
        const task = await this.prisma.clarificationTask.create({
          data: {
            applicantId,
            type: issue.type,
            severity: issue.severity,
            fieldPaths: issue.fieldPaths,
            message: issue.message,
            suggestedAction: issue.suggestedAction,
            raisedBy: 'RULE',
          },
        });
        tasks.push(task);
      } else {
        tasks.push(existing);
      }
    }

    return {
      totalIssues: issues.length,
      tasks,
    };
  }

  async getClarificationTasks(applicantId: string) {
    return this.prisma.clarificationTask.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveTask(taskId: string, applicantId: string, resolution: any) {
    const task = await this.prisma.clarificationTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.applicantId !== applicantId) {
      throw new NotFoundException('Clarification task not found');
    }

    return this.prisma.clarificationTask.update({
      where: { id: taskId },
      data: {
        status: ClarificationStatus.ANSWERED,
        resolution,
      },
    });
  }
}
