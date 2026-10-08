import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExtractionStatus } from '@prisma/client';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an official document for OCR & Multimodal extraction' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('conversationId') conversationId?: string,
  ) {
    return this.documentsService.uploadAndProcessDocument(
      user.applicantId,
      file,
      conversationId || user.conversationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get list of documents uploaded by applicant' })
  async getDocuments(@CurrentUser() user: any) {
    return this.documentsService.getDocuments(user.applicantId);
  }

  @Get(':id/extractions')
  @ApiOperation({ summary: 'Get extracted fields with confidence for a specific document' })
  async getExtractions(@Param('id') id: string) {
    return this.documentsService.getExtractions(id);
  }

  @Patch('extractions/:id')
  @ApiOperation({ summary: 'Confirm, edit, or reject a document extraction' })
  async updateExtraction(
    @Param('id') id: string,
    @Body() body: { status: ExtractionStatus; editedValue?: any },
  ) {
    return this.documentsService.updateExtraction(id, body.status, body.editedValue);
  }
}
