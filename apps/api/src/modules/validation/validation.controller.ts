import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Validation & Clarifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post('validation/run')
  @ApiOperation({ summary: 'Run deterministic validation engine across dates, overlaps, and mismatches' })
  async runValidation(@CurrentUser() user: any) {
    return this.validationService.runValidation(user.applicantId);
  }

  @Get('clarifications')
  @ApiOperation({ summary: 'Get list of clarification tasks (Blockers, Warnings, Info)' })
  async getClarifications(@CurrentUser() user: any) {
    return this.validationService.getClarificationTasks(user.applicantId);
  }

  @Post('clarifications/:id/resolve')
  @ApiOperation({ summary: 'Resolve a clarification task with user decision or explanation' })
  async resolveTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { resolution: any },
  ) {
    return this.validationService.resolveTask(id, user.applicantId, body.resolution);
  }
}
