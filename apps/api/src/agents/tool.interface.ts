import { z } from 'zod';

export interface AgentContext {
  applicantId: string;
  conversationId: string;
  runId: string;
  userMessage?: string;
}

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  execute(input: TInput, ctx: AgentContext): Promise<TOutput>;
}
