import { Controller, Post, Get, Patch, Param, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CvService } from './cv.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CvLanguage } from '@prisma/client';

@ApiTags('CV Studio')
@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate structured professional CV and PDF from verified facts' })
  async generate(
    @CurrentUser() user: any,
    @Body() body: { templateId?: string; language?: CvLanguage },
  ) {
    return this.cvService.generateCv(user.applicantId, body.templateId, body.language);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CV document details with per-field provenance metadata' })
  async getCv(@Param('id') id: string) {
    return this.cvService.getCv(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download or stream generated CV PDF file' })
  async getCvPdf(@Param('id') id: string, @Res() res: Response) {
    const { stream, mimeType } = await this.cvService.getCvPdfStream(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="educaro_cv_${id}.pdf"`);
    stream.pipe(res);
  }

  @Patch(':id/sections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Edit CV sections (e.g. summary polish) with automatic PDF re-render' })
  async updateSections(
    @Param('id') id: string,
    @Body() body: { sections: any },
  ) {
    return this.cvService.updateSections(id, body.sections);
  }
}
