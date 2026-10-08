import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AgentStreamEvent {
  conversationId: string;
  applicantId?: string;
  type:
    | 'agent.thinking'
    | 'agent.tool_call'
    | 'agent.tool_result'
    | 'agent.message_delta'
    | 'agent.ui_directive'
    | 'profile.updated'
    | 'document.progress'
    | 'validation.issue'
    | 'qualification.updated'
    | 'recommendation.ready'
    | 'run.completed'
    | 'heartbeat';
  data: any;
  timestamp: string;
}

@Injectable()
export class SseHubService {
  private readonly eventSubject = new Subject<AgentStreamEvent>();

  emit(event: Omit<AgentStreamEvent, 'timestamp'>) {
    this.eventSubject.next({
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  getStream(conversationId: string): Observable<{ data: AgentStreamEvent }> {
    return this.eventSubject.asObservable().pipe(
      filter((e) => e.conversationId === conversationId || e.conversationId === 'global'),
      map((e) => ({ data: e })),
    );
  }
}
