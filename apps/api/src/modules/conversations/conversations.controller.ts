import { Controller, Post, Get, Param, Body, Sse, MessageEvent } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get full message history for conversation' })
  async getMessages(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send user message or UI-directive response, triggering Orchestrator agent loop' })
  async postMessage(
    @Param('id') id: string,
    @Body() body: { content: string; uiResponse?: any },
  ) {
    return this.conversationsService.postMessage(id, body.content, body.uiResponse);
  }

  @Sse(':id/stream')
  @ApiOperation({ summary: 'SSE real-time stream of agent thoughts, tool calls, and profile updates' })
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.conversationsService.getStream(id).pipe(
      map((event) => ({
        data: event.data,
      })),
    );
  }
}
