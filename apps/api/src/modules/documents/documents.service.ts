import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../../storage/local-storage.service';
import { LlmService } from '../../llm/llm.service';
import { SseHubService } from '../../common/sse/sse-hub.service';
import { DOC_EXTRACTION_PROMPT } from '../../agents/prompts/system.prompts';
import {
  DocumentType,
  DocumentProcessingStatus,
  ExtractionStatus,
  Provenance,
  EvidenceType,
} from '@prisma/client';
import { z } from 'zod';

const ExtractionSchema = z.object({
  documentType: z.enum([
    'DEGREE',
    'TRANSCRIPT',
    'CERTIFICATE',
    'EXPERIENCE_LETTER',
    'LANGUAGE_CERT',
    'CV',
    'PASSPORT',
    'OTHER',
  ]),
  classifiedConfidence: z.number().default(0.95),
  fields: z.array(
    z.object({
      fieldPath: z.string(),
      value: z.any(),
      confidence: z.number().default(0.95),
      pageNumber: z.number().default(1),
      bbox: z.any().optional(),
    }),
  ),
});

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly llm: LlmService,
    private readonly sseHub: SseHubService,
  ) {}

  async uploadAndProcessDocument(
    applicantId: string,
    file: Express.Multer.File,
    conversationId?: string,
  ) {
    // 1. Save File to local disk
    const saved = await this.storage.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'documents',
    );

    // 2. Create Document record in DB
    const doc = await this.prisma.document.create({
      data: {
        applicantId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        storageKey: saved.storageKey,
        processingStatus: DocumentProcessingStatus.QUEUED,
        pages: 1,
      },
    });

    this.emitProgress(conversationId, applicantId, doc.id, 'Uploaded file', 20);

    // 3. Process Extraction asynchronously or in-flow
    this.processDocumentAsync(doc.id, applicantId, file.buffer, file.mimetype, conversationId).catch(
      (err) => {
        this.logger.error(`Document processing failed for ${doc.id}: ${err.message}`);
      },
    );

    return doc;
  }

  private async processDocumentAsync(
    docId: string,
    applicantId: string,
    buffer: Buffer,
    mimeType: string,
    conversationId?: string,
  ) {
    try {
      this.emitProgress(conversationId, applicantId, docId, 'Classifying document & OCR', 50);

      await this.prisma.document.update({
        where: { id: docId },
        data: { processingStatus: DocumentProcessingStatus.OCR },
      });

      // Call LLM with schema
      const prompt = `Perform document intelligence extraction on this document image/content. Determine documentType and extract fields with confidence.`;
      const extractionResult = await this.llm.generateStructured(
        ExtractionSchema,
        prompt,
        DOC_EXTRACTION_PROMPT,
        [{ mimeType, buffer }],
      );

      const data = extractionResult.data;

      // Update Document metadata
      await this.prisma.document.update({
        where: { id: docId },
        data: {
          type: data.documentType as DocumentType,
          classifiedConfidence: data.classifiedConfidence,
          processingStatus: DocumentProcessingStatus.DONE,
          ocrText: extractionResult.rawText,
        },
      });

      this.emitProgress(conversationId, applicantId, docId, 'Extracted structured facts', 90);

      // Save Extractions & ProfileFacts with AI_EXTRACTED provenance
      for (const f of data.fields) {
        await this.prisma.documentExtraction.create({
          data: {
            documentId: docId,
            fieldPath: f.fieldPath,
            value: f.value,
            confidence: f.confidence,
            pageNumber: f.pageNumber,
            bbox: f.bbox,
            status: ExtractionStatus.PENDING_REVIEW,
          },
        });

        const fact = await this.prisma.profileFact.create({
          data: {
            applicantId,
            fieldPath: f.fieldPath,
            value: f.value,
            provenance: Provenance.AI_EXTRACTED,
            confidence: f.confidence,
            evidenceType: EvidenceType.DOCUMENT,
            evidenceRef: {
              documentId: docId,
              pageNumber: f.pageNumber,
              bbox: f.bbox,
            },
          },
        });

        if (conversationId) {
          this.sseHub.emit({
            conversationId,
            applicantId,
            type: 'profile.updated',
            data: {
              fieldPath: f.fieldPath,
              value: f.value,
              provenance: 'AI_EXTRACTED',
              confidence: f.confidence,
              factId: fact.id,
            },
          });
        }
      }

      this.emitProgress(conversationId, applicantId, docId, 'Processing complete', 100);
    } catch (err: any) {
      await this.prisma.document.update({
        where: { id: docId },
        data: { processingStatus: DocumentProcessingStatus.FAILED },
      });
      throw err;
    }
  }

  async getDocuments(applicantId: string) {
    return this.prisma.document.findMany({
      where: { applicantId },
      include: { extractions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExtractions(documentId: string) {
    return this.prisma.documentExtraction.findMany({
      where: { documentId },
    });
  }

  async updateExtraction(
    extractionId: string,
    status: ExtractionStatus,
    editedValue?: any,
  ) {
    const extraction = await this.prisma.documentExtraction.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) throw new NotFoundException('Extraction not found');

    const updated = await this.prisma.documentExtraction.update({
      where: { id: extractionId },
      data: {
        status,
        value: editedValue !== undefined ? editedValue : extraction.value,
      },
    });

    return updated;
  }

  private emitProgress(
    conversationId: string | undefined,
    applicantId: string,
    docId: string,
    step: string,
    percent: number,
  ) {
    if (conversationId) {
      this.sseHub.emit({
        conversationId,
        applicantId,
        type: 'document.progress',
        data: { documentId: docId, step, percent },
      });
    }
  }
}
