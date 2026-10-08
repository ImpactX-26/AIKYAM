import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Qualification & What-If Simulator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qualification')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post('run')
  @ApiOperation({ summary: 'Compute deterministic qualification outcome and requirement gaps' })
  async runQualification(@CurrentUser() user: any) {
    return this.qualificationService.runQualification(user.applicantId);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest qualification status, score gauge, breakdown, and effort estimates' })
  async getLatest(@CurrentUser() user: any) {
    return this.qualificationService.getLatestResult(user.applicantId);
  }

  @Get('what-if')
  @ApiOperation({ summary: 'Simulate scenario changes (e.g. higher German level or APS completion) without modifying profile' })
  @ApiQuery({ name: 'germanLevel', required: false })
  @ApiQuery({ name: 'englishLevel', required: false })
  @ApiQuery({ name: 'yearsOfExperience', required: false, type: Number })
  @ApiQuery({ name: 'hasAps', required: false, type: Boolean })
  async whatIf(
    @CurrentUser() user: any,
    @Query('germanLevel') germanLevel?: string,
    @Query('englishLevel') englishLevel?: string,
    @Query('yearsOfExperience') yearsOfExperience?: number,
    @Query('hasAps') hasAps?: string,
  ) {
    return this.qualificationService.simulateChanges(user.applicantId, {
      germanLevel,
      englishLevel,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
      hasAps: hasAps === 'true',
    });
  }
}
