import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Recommendations & Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Get tailored Educaro pathway recommendations for current applicant' })
  async getRecommendations(@CurrentUser() user: any) {
    return this.recommendationsService.getRecommendations(user.applicantId);
  }

  @Post('referrals')
  @ApiOperation({ summary: 'Book consultant 1-on-1 handoff with auto-generated summary of profile' })
  async bookReferral(
    @CurrentUser() user: any,
    @Body() body: { notes?: string; slotRequestedAt?: string },
  ) {
    return this.recommendationsService.createConsultantReferral(
      user.applicantId,
      body.notes,
      body.slotRequestedAt ? new Date(body.slotRequestedAt) : undefined,
    );
  }
}
