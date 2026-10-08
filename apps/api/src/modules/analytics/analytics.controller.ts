import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Analytics & Consultant Dashboard')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('agent-runs/:id')
  @ApiOperation({ summary: 'Get full execution trace of an agent run (thoughts, tool calls, latencies)' })
  async getRunTrace(@Param('id') id: string) {
    return this.analyticsService.getAgentRunTrace(id);
  }

  @Get('analytics/funnel')
  @ApiOperation({ summary: 'Get conversion funnel metrics for consultant dashboard' })
  async getFunnel() {
    return this.analyticsService.getFunnelStats();
  }

  @Get('consultant/applicants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List applicants with goals, completeness, and qualification outcomes' })
  async getApplicants() {
    return this.analyticsService.getConsultantApplicants();
  }

  @Get('consultant/applicants/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get full 360-degree applicant profile, evidence trail, and agent traces' })
  async getApplicantDetail(@Param('id') id: string) {
    return this.analyticsService.getConsultantApplicantDetail(id);
  }
}
