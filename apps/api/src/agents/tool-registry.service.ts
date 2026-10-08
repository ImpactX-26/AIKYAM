import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AgentTool, AgentContext } from './tool.interface';
import { PrismaService } from '../prisma/prisma.service';
import { SseHubService } from '../common/sse/sse-hub.service';
import { computeCompleteness } from '../deterministic/completeness';
import { runDeterministicValidation } from '../deterministic/validation';
import { evaluateQualification } from '../deterministic/qualification';
import { generateRecommendations } from '../deterministic/recommendation-engine';
import { Provenance, EvidenceType, ClarificationStatus } from '@prisma/client';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, AgentTool>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseHub: SseHubService,
  ) {
    this.registerTools();
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  private registerTools() {
    // 1. get_profile_snapshot
    this.register({
      name: 'get_profile_snapshot',
      description: 'Get full current profile, facts, completeness score, and remaining gaps.',
      inputSchema: z.object({}),
      execute: async (_input, ctx) => {
        const applicant = await this.prisma.applicant.findUnique({
          where: { id: ctx.applicantId },
          include: {
            personal: true,
            educations: true,
            employments: true,
            skills: true,
            languages: true,
            documents: true,
            motivation: true,
            media: true,
            profileFacts: true,
            clarificationTasks: { where: { status: ClarificationStatus.OPEN } },
            qualificationResults: { orderBy: { computedAt: 'desc' }, take: 1 },
          },
        });

        if (!applicant) throw new Error('Applicant not found');

        const completeness = computeCompleteness(applicant);
        return {
          applicant,
          completeness,
        };
      },
    });

    // 2. update_profile_fact
    this.register({
      name: 'update_profile_fact',
      description: 'Update or add a profile fact with required provenance and evidence pointer.',
      inputSchema: z.object({
        fieldPath: z.string(),
        value: z.any(),
        provenance: z.enum(['VERIFIED', 'APPLICANT_PROVIDED', 'AI_EXTRACTED', 'AI_GENERATED']),
        confidence: z.number().min(0).max(1).default(1.0),
        evidenceType: z.enum(['DOCUMENT', 'VIDEO', 'CHAT', 'MANUAL']).default('CHAT'),
        evidenceRef: z.any().optional(),
      }),
      execute: async (input, ctx) => {
        // Find existing version
        const existing = await this.prisma.profileFact.findFirst({
          where: { applicantId: ctx.applicantId, fieldPath: input.fieldPath },
          orderBy: { version: 'desc' },
        });

        const nextVersion = existing ? existing.version + 1 : 1;

        const fact = await this.prisma.profileFact.create({
          data: {
            applicantId: ctx.applicantId,
            fieldPath: input.fieldPath,
            value: input.value,
            provenance: input.provenance as Provenance,
            confidence: input.confidence,
            evidenceType: input.evidenceType as EvidenceType,
            evidenceRef: input.evidenceRef,
            version: nextVersion,
          },
        });

        // Update normalized table field if applicable
        await this.syncFactToNormalizedModel(ctx.applicantId, input.fieldPath, input.value);

        // Stream real-time profile update to UI
        this.sseHub.emit({
          conversationId: ctx.conversationId,
          applicantId: ctx.applicantId,
          type: 'profile.updated',
          data: {
            fieldPath: input.fieldPath,
            value: input.value,
            provenance: input.provenance,
            confidence: input.confidence,
            factId: fact.id,
          },
        });

        return { success: true, factId: fact.id, version: nextVersion };
      },
    });

    // 3. ask_user
    this.register({
      name: 'ask_user',
      description: 'Emit a focused question with quick-reply chips or an interactive UI directive.',
      inputSchema: z.object({
        question: z.string(),
        explanation: z.string().optional(),
        quickReplies: z.array(z.string()).optional(),
        uiDirective: z
          .object({
            type: z.enum([
              'CHOICE_CHIPS',
              'CEFR_SELECTOR',
              'DATE_PICKER',
              'FILE_DROPZONE',
              'CONFIRM_CARD',
              'MINI_FORM',
            ]),
            targetField: z.string().optional(),
            options: z.array(z.string()).optional(),
          })
          .optional(),
      }),
      execute: async (input, ctx) => {
        // Emit UI directive over SSE
        this.sseHub.emit({
          conversationId: ctx.conversationId,
          applicantId: ctx.applicantId,
          type: 'agent.ui_directive',
          data: input,
        });

        // Save agent message to DB
        await this.prisma.message.create({
          data: {
            conversationId: ctx.conversationId,
            role: 'AGENT',
            content: input.question,
            uiHints: input,
          },
        });

        return { emitted: true };
      },
    });

    // 4. run_validation
    this.register({
      name: 'run_validation',
      description: 'Run deterministic validation rules and record clarification tasks.',
      inputSchema: z.object({}),
      execute: async (_input, ctx) => {
        const applicant = await this.prisma.applicant.findUnique({
          where: { id: ctx.applicantId },
          include: {
            personal: true,
            educations: true,
            employments: true,
            languages: true,
            documents: true,
          },
        });

        if (!applicant) throw new Error('Applicant not found');

        const issues = runDeterministicValidation({
          goal: applicant.goal,
          personal: applicant.personal,
          educations: applicant.educations,
          employments: applicant.employments,
          languages: applicant.languages,
          documents: applicant.documents,
        });

        // Store new clarification tasks
        for (const issue of issues) {
          const existing = await this.prisma.clarificationTask.findFirst({
            where: {
              applicantId: ctx.applicantId,
              message: issue.message,
              status: ClarificationStatus.OPEN,
            },
          });

          if (!existing) {
            const task = await this.prisma.clarificationTask.create({
              data: {
                applicantId: ctx.applicantId,
                type: issue.type,
                severity: issue.severity,
                fieldPaths: issue.fieldPaths,
                message: issue.message,
                suggestedAction: issue.suggestedAction,
                raisedBy: 'RULE',
              },
            });

            this.sseHub.emit({
              conversationId: ctx.conversationId,
              applicantId: ctx.applicantId,
              type: 'validation.issue',
              data: task,
            });
          }
        }

        return { issuesCount: issues.length, issues };
      },
    });

    // 5. run_qualification
    this.register({
      name: 'run_qualification',
      description: 'Evaluate qualification rules deterministically for applicant pathway.',
      inputSchema: z.object({}),
      execute: async (_input, ctx) => {
        const applicant = await this.prisma.applicant.findUnique({
          where: { id: ctx.applicantId },
          include: {
            personal: true,
            educations: true,
            employments: true,
            languages: true,
            documents: true,
          },
        });

        if (!applicant) throw new Error('Applicant not found');

        const pathway = (applicant.goal === 'UNDECIDED' ? 'STUDY' : applicant.goal) as
          | 'STUDY'
          | 'VOCATIONAL'
          | 'WORK';

        const ruleSet = await this.prisma.qualificationRuleSet.findFirst({
          where: { pathway, isActive: true },
          orderBy: { createdAt: 'desc' },
        });

        if (!ruleSet) throw new Error(`No active rule set found for pathway ${pathway}`);

        const outcome = evaluateQualification(pathway, ruleSet.rulesJson, applicant);

        const result = await this.prisma.qualificationResult.create({
          data: {
            applicantId: ctx.applicantId,
            ruleSetId: ruleSet.id,
            pathway,
            status: outcome.status,
            score: outcome.score,
            breakdown: outcome.breakdown as any,
            missingRequirements: outcome.missingRequirements as any,
            explanation: outcome.explanation,
          },
        });

        this.sseHub.emit({
          conversationId: ctx.conversationId,
          applicantId: ctx.applicantId,
          type: 'qualification.updated',
          data: result,
        });

        return result;
      },
    });

    // 6. recommend_next_step
    this.register({
      name: 'recommend_next_step',
      description: 'Generate Educaro ecosystem recommendation based on qualification and gaps.',
      inputSchema: z.object({}),
      execute: async (_input, ctx) => {
        const applicant = await this.prisma.applicant.findUnique({
          where: { id: ctx.applicantId },
          include: {
            qualificationResults: { orderBy: { computedAt: 'desc' }, take: 1 },
            clarificationTasks: { where: { status: ClarificationStatus.OPEN } },
          },
        });

        if (!applicant) throw new Error('Applicant not found');

        const latestQual = applicant.qualificationResults[0];
        const recs = generateRecommendations(
          applicant.goal as any,
          latestQual,
          applicant.clarificationTasks,
        );

        const createdRecs = [];
        for (const r of recs) {
          const rec = await this.prisma.recommendation.create({
            data: {
              applicantId: ctx.applicantId,
              serviceCode: r.serviceCode,
              type: r.type,
              title: r.title,
              reasoning: r.reasoning,
              priority: r.priority,
              nextActions: r.nextActions,
            },
          });
          createdRecs.push(rec);
        }

        this.sseHub.emit({
          conversationId: ctx.conversationId,
          applicantId: ctx.applicantId,
          type: 'recommendation.ready',
          data: createdRecs,
        });

        return { recommendations: createdRecs };
      },
    });

    // 7. request_document
    this.register({
      name: 'request_document',
      description: 'Request the applicant to upload an official document.',
      inputSchema: z.object({
        documentType: z.enum([
          'DEGREE',
          'TRANSCRIPT',
          'CERTIFICATE',
          'EXPERIENCE_LETTER',
          'LANGUAGE_CERT',
          'CV',
          'PASSPORT',
          'OTHER',
        ]),
        title: z.string(),
        instructions: z.string(),
      }),
      execute: async (input, ctx) => {
        const directive = {
          question: `Please upload your ${input.title}.`,
          explanation: input.instructions,
          uiDirective: {
            type: 'FILE_DROPZONE' as const,
            targetField: `documents.${input.documentType.toLowerCase()}`,
            options: [input.documentType],
          },
        };

        this.sseHub.emit({
          conversationId: ctx.conversationId,
          applicantId: ctx.applicantId,
          type: 'agent.ui_directive',
          data: directive,
        });

        return { requested: input.documentType };
      },
    });
  }

  private register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  private async syncFactToNormalizedModel(applicantId: string, fieldPath: string, value: any) {
    try {
      if (fieldPath === 'personal.name') {
        await this.prisma.profilePersonal.upsert({
          where: { applicantId },
          create: { applicantId, name: String(value) },
          update: { name: String(value) },
        });
      } else if (fieldPath === 'personal.dob') {
        await this.prisma.profilePersonal.upsert({
          where: { applicantId },
          create: { applicantId, dob: new Date(value) },
          update: { dob: new Date(value) },
        });
      } else if (fieldPath === 'languages.cefrLevel' || fieldPath.startsWith('languages[')) {
        await this.prisma.languageProficiency.create({
          data: {
            applicantId,
            language: 'German',
            cefrLevel: String(value),
            source: 'SELF_DECLARED',
          },
        });
      } else if (fieldPath === 'applicant.goal') {
        await this.prisma.applicant.update({
          where: { id: applicantId },
          data: { goal: value },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Failed to sync fact to normalized model: ${e.message}`);
    }
  }
}
