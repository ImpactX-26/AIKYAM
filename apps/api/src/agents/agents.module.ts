import { Module } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';
import { OrchestratorService } from './orchestrator.service';

@Module({
  providers: [ToolRegistryService, OrchestratorService],
  exports: [ToolRegistryService, OrchestratorService],
})
export class AgentsModule {}
