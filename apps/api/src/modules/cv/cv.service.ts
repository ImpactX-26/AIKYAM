import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../../storage/local-storage.service';
import { LlmService } from '../../llm/llm.service';
import { CV_SUMMARY_PROMPT } from '../../agents/prompts/system.prompts';
import { CvLanguage } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly llm: LlmService,
  ) {}

  async generateCv(applicantId: string, templateId = 'modern_german', language: CvLanguage = CvLanguage.EN) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        personal: true,
        educations: { orderBy: { startDate: 'desc' } },
        employments: { orderBy: { startDate: 'desc' } },
        skills: true,
        languages: true,
        profileFacts: true,
      },
    });

    if (!applicant) throw new NotFoundException('Applicant not found');

    // Filter verified / applicant provided facts for hard data
    const nonAiFacts = applicant.profileFacts.filter((f) => f.provenance !== 'AI_GENERATED');

    // Generate professional summary with LLM
    const summaryPrompt = `Draft a 3-sentence professional summary for a German application CV (${language === 'DE' ? 'in German' : 'in English'}) for:
Name: ${applicant.personal?.name || 'Applicant'}
Goal: ${applicant.goal}
Degree: ${applicant.educations?.[0]?.degree || 'Graduate'} in ${applicant.educations?.[0]?.fieldOfStudy || 'Field'}
Key Skills: ${applicant.skills?.map((s) => s.name).slice(0, 5).join(', ')}
Languages: ${applicant.languages?.map((l) => `${l.language} (${l.cefrLevel})`).join(', ')}`;

    const summaryRes = await this.llm.generateText(summaryPrompt, CV_SUMMARY_PROMPT);

    const contentJson = {
      templateId,
      language,
      header: {
        name: applicant.personal?.name || 'Candidate Name',
        provenance: 'APPLICANT_PROVIDED',
        email: applicant.personal?.email || applicant.userId,
        phone: applicant.personal?.phone || '+91 XXXXX XXXXX',
        location: applicant.personal?.cityIndia || 'India',
        targetCity: applicant.personal?.targetCityGermany || 'Germany',
      },
      summary: {
        text: summaryRes.text,
        provenance: 'AI_GENERATED',
      },
      education: applicant.educations.map((e) => ({
        degree: e.degree,
        institution: e.institution,
        field: e.fieldOfStudy,
        grade: e.grade,
        startDate: e.startDate,
        endDate: e.endDate,
        provenance: 'VERIFIED',
      })),
      employment: applicant.employments.map((e) => ({
        role: e.role,
        employer: e.employer,
        responsibilities: e.responsibilities,
        startDate: e.startDate,
        endDate: e.endDate,
        provenance: 'APPLICANT_PROVIDED',
      })),
      languages: applicant.languages.map((l) => ({
        language: l.language,
        cefrLevel: l.cefrLevel,
        certificate: l.certificateName,
        provenance: l.certificateName ? 'VERIFIED' : 'APPLICANT_PROVIDED',
      })),
      skills: applicant.skills.map((s) => ({
        name: s.name,
        category: s.category,
        provenance: 'APPLICANT_PROVIDED',
      })),
    };

    // Render PDF buffer using PDFKit
    const pdfBuffer = await this.renderPdfBuffer(contentJson);
    const saved = await this.storage.saveFile(
      pdfBuffer,
      `cv_${applicant.personal?.name || 'applicant'}_${language}.pdf`,
      'application/pdf',
      'cvs',
    );

    const cvDoc = await this.prisma.cvDocument.create({
      data: {
        applicantId,
        templateId,
        language,
        contentJson,
        pdfStorageKey: saved.storageKey,
      },
    });

    return cvDoc;
  }

  async getCv(id: string) {
    const cv = await this.prisma.cvDocument.findUnique({ where: { id } });
    if (!cv) throw new NotFoundException('CV Document not found');
    return cv;
  }

  async getCvPdfStream(id: string) {
    const cv = await this.getCv(id);
    if (!cv.pdfStorageKey) throw new NotFoundException('PDF file not found for CV');
    return this.storage.getFileStream(cv.pdfStorageKey);
  }

  async updateSections(id: string, sections: any) {
    const cv = await this.getCv(id);
    const updatedContent = { ...(cv.contentJson as any), ...sections };

    const pdfBuffer = await this.renderPdfBuffer(updatedContent);
    const saved = await this.storage.saveFile(
      pdfBuffer,
      `cv_${id}_updated.pdf`,
      'application/pdf',
      'cvs',
    );

    return this.prisma.cvDocument.update({
      where: { id },
      data: {
        contentJson: updatedContent,
        pdfStorageKey: saved.storageKey,
        version: cv.version + 1,
      },
    });
  }

  private renderPdfBuffer(content: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header (German Lebenslauf DIN style)
      doc.fontSize(22).fillColor('#0f172a').text(content.header?.name || 'Curriculum Vitae', { align: 'left' });
      doc.fontSize(10).fillColor('#64748b').text(
        `${content.header?.email || ''} | ${content.header?.phone || ''} | ${content.header?.location || ''} -> ${content.header?.targetCity || 'Germany'}`
      );
      doc.moveDown(0.5);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Professional Summary
      doc.fontSize(12).fillColor('#0369a1').text('PROFESSIONAL PROFILE');
      doc.fontSize(10).fillColor('#334155').text(content.summary?.text || '');
      doc.moveDown(1);

      // Education Section
      if (content.education && content.education.length > 0) {
        doc.fontSize(12).fillColor('#0369a1').text('EDUCATION & QUALIFICATIONS');
        doc.moveDown(0.3);
        for (const edu of content.education) {
          doc.fontSize(10).fillColor('#0f172a').text(`${edu.degree} - ${edu.field}`, { bold: true } as any);
          doc.fontSize(9).fillColor('#64748b').text(`${edu.institution} | Grade: ${edu.grade || 'N/A'}`);
          doc.moveDown(0.4);
        }
        doc.moveDown(0.6);
      }

      // Employment Section
      if (content.employment && content.employment.length > 0) {
        doc.fontSize(12).fillColor('#0369a1').text('PROFESSIONAL EXPERIENCE');
        doc.moveDown(0.3);
        for (const emp of content.employment) {
          doc.fontSize(10).fillColor('#0f172a').text(`${emp.role} at ${emp.employer}`);
          if (emp.responsibilities) {
            doc.fontSize(9).fillColor('#334155').text(emp.responsibilities);
          }
          doc.moveDown(0.4);
        }
        doc.moveDown(0.6);
      }

      // Languages Section
      if (content.languages && content.languages.length > 0) {
        doc.fontSize(12).fillColor('#0369a1').text('LANGUAGES');
        doc.moveDown(0.3);
        const langStr = content.languages.map((l: any) => `${l.language}: ${l.cefrLevel}${l.certificate ? ` (${l.certificate})` : ''}`).join('  •  ');
        doc.fontSize(10).fillColor('#334155').text(langStr);
        doc.moveDown(0.8);
      }

      // Skills Section
      if (content.skills && content.skills.length > 0) {
        doc.fontSize(12).fillColor('#0369a1').text('KEY SKILLS & COMPETENCIES');
        doc.moveDown(0.3);
        const skillStr = content.skills.map((s: any) => s.name).join('  •  ');
        doc.fontSize(10).fillColor('#334155').text(skillStr);
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Generated by Educaro Compass • Verified Indian Applicant Journey', 40, 780, { align: 'center' });

      doc.end();
    });
  }
}
