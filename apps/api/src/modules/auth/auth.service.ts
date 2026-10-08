import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole, ApplicantGoal } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { email: string; password?: string; role?: UserRole; locale?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role || UserRole.APPLICANT,
        locale: data.locale || 'en',
        isGuest: false,
      },
    });

    let applicantId: string | undefined;
    let conversationId: string | undefined;

    if (user.role === UserRole.APPLICANT) {
      const applicant = await this.prisma.applicant.create({
        data: {
          userId: user.id,
          goal: ApplicantGoal.UNDECIDED,
        },
      });
      applicantId = applicant.id;

      const conversation = await this.prisma.conversation.create({
        data: {
          applicantId: applicant.id,
          status: 'ACTIVE',
        },
      });
      conversationId = conversation.id;

      // Seed initial welcoming message
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'AGENT',
          content:
            'Hello and welcome to Educaro Compass! I am your AI Guide to Germany. Are you planning to study, pursue vocational training (Ausbildung), or work as a skilled professional?',
          uiHints: {
            quickReplies: [
              'Study (Bachelor / Master)',
              'Ausbildung (Vocational Training)',
              'Skilled Work / Chancenkarte',
            ],
          },
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        applicantId,
        conversationId,
        isGuest: false,
      },
    };
  }

  async login(data: { email: string; password?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        applicant: {
          include: { conversations: { take: 1, orderBy: { createdAt: 'desc' } } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.passwordHash && data.password) {
      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid email or password.');
      }
    }

    const token = this.generateToken(user.id, user.email, user.role);
    const applicantId = user.applicant?.id;
    const conversationId = user.applicant?.conversations[0]?.id;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        applicantId,
        conversationId,
        isGuest: user.isGuest,
      },
    };
  }

  async createGuestSession(goal?: ApplicantGoal) {
    const guestId = uuidv4().slice(0, 8);
    const email = `guest_${guestId}@educarocompass.demo`;

    const user = await this.prisma.user.create({
      data: {
        email,
        role: UserRole.APPLICANT,
        isGuest: true,
      },
    });

    const applicant = await this.prisma.applicant.create({
      data: {
        userId: user.id,
        goal: goal || ApplicantGoal.UNDECIDED,
        consentGivenAt: new Date(),
        consentVersion: 'v1.0-guest',
      },
    });

    const conversation = await this.prisma.conversation.create({
      data: {
        applicantId: applicant.id,
      },
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AGENT',
        content:
          'Welcome to your Educaro Compass demo journey! What is your primary destination goal in Germany?',
        uiHints: {
          quickReplies: [
            'Study (Master / Bachelor)',
            'Ausbildung (Healthcare / IT)',
            'Skilled Work (Blue Card)',
          ],
        },
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        applicantId: applicant.id,
        conversationId: conversation.id,
        isGuest: true,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        applicant: {
          include: {
            personal: true,
            conversations: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      applicantId: user.applicant?.id,
      conversationId: user.applicant?.conversations[0]?.id,
      isGuest: user.isGuest,
      personal: user.applicant?.personal,
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}
