import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get complete structured profile with provenance facts and completeness score' })
  async getProfile(@CurrentUser() user: any) {
    return this.profileService.getFullProfile(user.applicantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update personal profile section' })
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.profileService.updatePersonal(user.applicantId, body);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record explicit user consent for GDPR / Responsible AI compliance' })
  async recordConsent(@CurrentUser() user: any, @Body() body: { version?: string }) {
    return this.profileService.recordConsent(user.applicantId, body.version);
  }

  @Patch('facts/:id/confirm')
  @ApiOperation({ summary: 'Confirm an AI-extracted fact, upgrading provenance to VERIFIED or APPLICANT_PROVIDED' })
  async confirmFact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.profileService.confirmFact(id, user.applicantId);
  }

  @Patch('facts/:id/edit')
  @ApiOperation({ summary: 'Edit an extracted fact value, creating a new version with human-in-the-loop audit trail' })
  async editFact(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { value: any }) {
    return this.profileService.editFact(id, user.applicantId, body.value);
  }

  @Patch('facts/:id/reject')
  @ApiOperation({ summary: 'Reject an AI-extracted fact' })
  async rejectFact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.profileService.rejectFact(id, user.applicantId);
  }
}
