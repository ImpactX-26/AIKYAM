import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { computeCompleteness } from '../../deterministic/completeness';
import { Provenance, EvidenceType } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getFullProfile(applicantId: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        user: { select: { email: true, role: true, locale: true } },
        personal: true,
        educations: { orderBy: { startDate: 'desc' } },
        employments: { orderBy: { startDate: 'desc' } },
        skills: true,
        languages: true,
        documents: {
          include: { extractions: true },
          orderBy: { createdAt: 'desc' },
        },
        motivation: true,
        media: { orderBy: { createdAt: 'desc' } },
        profileFacts: { orderBy: { createdAt: 'desc' } },
        clarificationTasks: { orderBy: { createdAt: 'desc' } },
        qualificationResults: { orderBy: { computedAt: 'desc' }, take: 1 },
        recommendations: { orderBy: { priority: 'asc' } },
      },
    });

    if (!applicant) {
      throw new NotFoundException('Applicant profile not found.');
    }

    const completeness = computeCompleteness(applicant);

    // Group profile facts by fieldPath (latest version)
    const latestFacts: Record<string, any> = {};
    for (const fact of applicant.profileFacts) {
      if (!latestFacts[fact.fieldPath] || latestFacts[fact.fieldPath].version < fact.version) {
        latestFacts[fact.fieldPath] = fact;
      }
    }

    return {
      applicant,
      completeness,
      provenanceFacts: Object.values(latestFacts),
    };
  }

  async updatePersonal(applicantId: string, data: any) {
    const personal = await this.prisma.profilePersonal.upsert({
      where: { applicantId },
      create: {
        applicantId,
        ...data,
      },
      update: data,
    });

    // Record as APPLICANT_PROVIDED fact
    if (data.name) {
      await this.recordFact(applicantId, 'personal.name', data.name, Provenance.APPLICANT_PROVIDED);
    }
    if (data.dob) {
      await this.recordFact(applicantId, 'personal.dob', data.dob, Provenance.APPLICANT_PROVIDED);
    }

    return personal;
  }

  async recordConsent(applicantId: string, consentVersion = 'v1.0-impactx26') {
    return this.prisma.applicant.update({
      where: { id: applicantId },
      data: {
        consentGivenAt: new Date(),
        consentVersion,
      },
    });
  }

  async confirmFact(factId: string, applicantId: string) {
    const fact = await this.prisma.profileFact.findUnique({
      where: { id: factId },
    });

    if (!fact || fact.applicantId !== applicantId) {
      throw new NotFoundException('Profile fact not found');
    }

    // Upgrading provenance to APPLICANT_PROVIDED or VERIFIED
    const upgradedProvenance =
      fact.evidenceType === EvidenceType.DOCUMENT ? Provenance.VERIFIED : Provenance.APPLICANT_PROVIDED;

    const nextVersion = fact.version + 1;

    return this.prisma.profileFact.create({
      data: {
        applicantId,
        fieldPath: fact.fieldPath,
        value: fact.value as any,
        provenance: upgradedProvenance,
        confidence: 1.0,
        evidenceType: fact.evidenceType,
        evidenceRef: fact.evidenceRef as any,
        confirmedAt: new Date(),
        confirmedBy: 'APPLICANT',
        version: nextVersion,
      },
    });
  }

  async editFact(factId: string, applicantId: string, newValue: any) {
    const fact = await this.prisma.profileFact.findUnique({
      where: { id: factId },
    });

    if (!fact || fact.applicantId !== applicantId) {
      throw new NotFoundException('Profile fact not found');
    }

    const nextVersion = fact.version + 1;

    return this.prisma.profileFact.create({
      data: {
        applicantId,
        fieldPath: fact.fieldPath,
        value: newValue,
        provenance: Provenance.APPLICANT_PROVIDED,
        confidence: 1.0,
        evidenceType: EvidenceType.MANUAL,
        evidenceRef: { previousFactId: fact.id },
        confirmedAt: new Date(),
        confirmedBy: 'APPLICANT',
        version: nextVersion,
      },
    });
  }

  async rejectFact(factId: string, applicantId: string) {
    const fact = await this.prisma.profileFact.findUnique({
      where: { id: factId },
    });

    if (!fact || fact.applicantId !== applicantId) {
      throw new NotFoundException('Profile fact not found');
    }

    return this.prisma.profileFact.delete({
      where: { id: factId },
    });
  }

  private async recordFact(
    applicantId: string,
    fieldPath: string,
    value: any,
    provenance: Provenance,
  ) {
    const existing = await this.prisma.profileFact.findFirst({
      where: { applicantId, fieldPath },
      orderBy: { version: 'desc' },
    });

    const version = existing ? existing.version + 1 : 1;

    return this.prisma.profileFact.create({
      data: {
        applicantId,
        fieldPath,
        value,
        provenance,
        confidence: 1.0,
        evidenceType: EvidenceType.MANUAL,
        version,
      },
    });
  }
}
