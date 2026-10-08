import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrchestratorService } from '../../agents/orchestrator.service';
import { SseHubService } from '../../common/sse/sse-hub.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorService,
    private readonly sseHub: SseHubService,
  ) {}

  async getMessages(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation.messages;
  }

  async postMessage(conversationId: string, content: string, uiResponse?: any) {
    return this.orchestrator.processUserMessage(conversationId, content, uiResponse);
  }

  getStream(conversationId: string) {
    return this.sseHub.getStream(conversationId);
  }
}
