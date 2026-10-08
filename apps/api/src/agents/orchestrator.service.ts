import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SseHubService } from '../common/sse/sse-hub.service';
import { ToolRegistryService } from './tool-registry.service';
import { LlmService } from '../llm/llm.service';
import { computeCompleteness } from '../deterministic/completeness';
import { INTAKE_PROMPT } from './prompts/system.prompts';
import { AgentStepKind } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseHub: SseHubService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly llmService: LlmService,
  ) {}

  async processUserMessage(
    conversationId: string,
    userContent: string,
    uiResponse?: any,
  ): Promise<{ runId: string; responseText?: string }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { applicant: true },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const applicantId = conversation.applicantId;

    // 1. Record User Message in DB
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: userContent,
        uiHints: uiResponse || null,
      },
    });

    // 2. Create Agent Run
    const run = await this.prisma.agentRun.create({
      data: {
        applicantId,
        trigger: 'USER_MESSAGE',
        status: 'RUNNING',
      },
    });

    const ctx = {
      applicantId,
      conversationId,
      runId: run.id,
      userMessage: userContent,
    };

    // 3. Orchestration Step: Gap computation & decision
    try {
      await this.streamThinking(
        ctx,
        'Orchestrator is inspecting profile completeness and identifying pending requirements...',
      );

      const applicant = await this.prisma.applicant.findUnique({
        where: { id: applicantId },
        include: {
          personal: true,
          educations: true,
          employments: true,
          languages: true,
          documents: true,
          clarificationTasks: true,
        },
      });

      if (!applicant) throw new Error('Applicant not found');

      // Check for quick answers to goals
      if (applicant.goal === 'UNDECIDED') {
        const lower = userContent.toLowerCase();
        let determinedGoal: any = null;
        if (lower.includes('study') || lower.includes('master') || lower.includes('bachelor')) {
          determinedGoal = 'STUDY';
        } else if (lower.includes('ausbildung') || lower.includes('vocational') || lower.includes('nursing')) {
          determinedGoal = 'VOCATIONAL';
        } else if (lower.includes('work') || lower.includes('job') || lower.includes('cloud') || lower.includes('engineer')) {
          determinedGoal = 'WORK';
        }

        if (determinedGoal) {
          await this.executeTool(ctx, 'update_profile_fact', {
            fieldPath: 'applicant.goal',
            value: determinedGoal,
            provenance: 'APPLICANT_PROVIDED',
            confidence: 1.0,
            evidenceType: 'CHAT',
            evidenceRef: { message: userContent },
          });

          await this.executeTool(ctx, 'ask_user', {
            question: `Wonderful! We have aligned your journey to the ${determinedGoal} pathway in Germany. What is your full legal name as it appears on your passport?`,
            explanation: 'Official German applications and visa records require strict legal name verification.',
            quickReplies: [],
          });

          await this.completeRun(run.id, ctx);
          return { runId: run.id };
        }
      }

      // Check if user is answering a specific field
      if (uiResponse?.targetField && uiResponse?.value) {
        await this.executeTool(ctx, 'update_profile_fact', {
          fieldPath: uiResponse.targetField,
          value: uiResponse.value,
          provenance: 'APPLICANT_PROVIDED',
          confidence: 1.0,
          evidenceType: 'CHAT',
          evidenceRef: { response: uiResponse },
        });
      }

      // Compute deterministic gaps
      const completeness = computeCompleteness(applicant);
      await this.prisma.applicant.update({
        where: { id: applicantId },
        data: { completenessScore: completeness.score },
      });

      // Next best action policy based on highest weighted gap
      const topGap = completeness.gaps[0];

      if (!topGap || completeness.score >= 85) {
        // Run deterministic validation & qualification
        await this.executeTool(ctx, 'run_validation', {});
        await this.executeTool(ctx, 'run_qualification', {});
        await this.executeTool(ctx, 'recommend_next_step', {});

        await this.executeTool(ctx, 'ask_user', {
          question: `🎉 Great progress! Your profile completeness has reached ${completeness.score}%. Your qualification outcome and personalized Educaro recommendations are ready in your dashboard.`,
          explanation: 'You can now review your verified profile, inspect any clarification items, or simulate what-if scenarios.',
          quickReplies: ['View Qualification Details', 'Review Generated CV', 'Book Consultant Handoff'],
        });
      } else if (topGap.category === 'Personal' && topGap.field === 'name') {
        await this.executeTool(ctx, 'ask_user', {
          question: 'To get started, what is your full legal name as shown on your passport?',
          explanation: 'Your name will be used across official German visa and academic applications.',
          quickReplies: [],
        });
      } else if (topGap.category === 'Education') {
        await this.executeTool(ctx, 'ask_user', {
          question: 'What is your highest educational qualification (e.g. 12th Standard, B.Tech, B.Sc)?',
          explanation: 'German authorities require exact degree verification against the Anabin database.',
          quickReplies: ['B.Tech / B.E.', '12th Standard (Higher Secondary)', 'B.Sc / B.Com', 'Master Degree'],
        });
      } else if (topGap.category === 'Languages') {
        await this.executeTool(ctx, 'ask_user', {
          question: 'What is your current level in German on the CEFR scale (A1 to C1)?',
          explanation: 'German universities and Ausbildung programs set strict minimum CEFR language criteria.',
          quickReplies: ['No German (Beginner)', 'A1 Level', 'A2 Level', 'B1 Level', 'B2+ Advanced'],
          uiDirective: {
            type: 'CEFR_SELECTOR',
            targetField: 'languages.cefrLevel',
            options: ['A1', 'A2', 'B1', 'B2', 'C1'],
          },
        });
      } else if (topGap.category === 'Documents') {
        await this.executeTool(ctx, 'request_document', {
          documentType: applicant.goal === 'VOCATIONAL' ? 'CERTIFICATE' : 'DEGREE',
          title: applicant.goal === 'VOCATIONAL' ? '12th Standard Certificate' : 'Degree Certificate or Transcript',
          instructions: 'Upload a clear PDF or photo of your official certificate for automated verification.',
        });
      } else {
        await this.executeTool(ctx, 'ask_user', {
          question: `Would you like to record a quick 60-second video introduction sharing your goals for Germany?`,
          explanation: 'A video introduction helps German partner schools and employers get to know your motivation firsthand.',
          quickReplies: ['Yes, record video', 'Skip for now'],
        });
      }

      await this.completeRun(run.id, ctx);
      return { runId: run.id };
    } catch (error: any) {
      this.logger.error(`Orchestrator error: ${error.message}`);
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      throw error;
    }
  }

  private async streamThinking(ctx: any, thought: string) {
    await this.prisma.agentStep.create({
      data: {
        runId: ctx.runId,
        agentName: 'OrchestratorAgent',
        kind: AgentStepKind.THOUGHT_SUMMARY,
        input: { thought },
      },
    });

    this.sseHub.emit({
      conversationId: ctx.conversationId,
      applicantId: ctx.applicantId,
      type: 'agent.thinking',
      data: { thought },
    });
  }

  private async executeTool(ctx: any, toolName: string, input: any): Promise<any> {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found in registry`);

    this.sseHub.emit({
      conversationId: ctx.conversationId,
      applicantId: ctx.applicantId,
      type: 'agent.tool_call',
      data: { toolName, input },
    });

    const startTime = Date.now();
    let output: any;
    try {
      output = await tool.execute(input, ctx);
    } catch (err: any) {
      output = { error: err.message };
    }
    const latencyMs = Date.now() - startTime;

    await this.prisma.agentStep.create({
      data: {
        runId: ctx.runId,
        agentName: 'OrchestratorAgent',
        kind: AgentStepKind.TOOL_CALL,
        toolName,
        input,
        output,
        latencyMs,
      },
    });

    this.sseHub.emit({
      conversationId: ctx.conversationId,
      applicantId: ctx.applicantId,
      type: 'agent.tool_result',
      data: { toolName, output, latencyMs },
    });

    return output;
  }

  private async completeRun(runId: string, ctx: any) {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    });

    this.sseHub.emit({
      conversationId: ctx.conversationId,
      applicantId: ctx.applicantId,
      type: 'run.completed',
      data: { runId, status: 'COMPLETED' },
    });
  }
}
