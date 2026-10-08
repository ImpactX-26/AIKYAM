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

  async googleLogin(data: {
    credential?: string;
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
  }) {
    let email = data.email?.toLowerCase().trim();
    let name = data.name?.trim();
    let googleId = data.googleId;
    let avatarUrl = data.avatarUrl;

    // Decode Google ID Token / Credential if present
    if (data.credential) {
      try {
        const parts = data.credential.split('.');
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const parsed = JSON.parse(payloadJson);
          if (parsed.email) email = parsed.email.toLowerCase().trim();
          if (parsed.name) name = parsed.name;
          if (parsed.sub) googleId = parsed.sub;
          if (parsed.picture) avatarUrl = parsed.picture;
        }
      } catch (e) {
        // Fallback to direct fields
      }
    }

    if (!email) {
      throw new BadRequestException('A valid Google email or credential is required.');
    }

    // 1. Check if user already exists
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : []),
        ],
      },
      include: {
        applicant: {
          include: {
            personal: true,
            conversations: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (user) {
      // Update Google ID and Avatar if not set
      if ((!user.googleId && googleId) || (!user.avatarUrl && avatarUrl)) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            avatarUrl: user.avatarUrl || avatarUrl,
          },
          include: {
            applicant: {
              include: {
                personal: true,
                conversations: { take: 1, orderBy: { createdAt: 'desc' } },
              },
            },
          },
        });
      }

      // Ensure applicant record exists
      let applicantId = user.applicant?.id;
      let conversationId = user.applicant?.conversations[0]?.id;

      if (!applicantId) {
        const applicant = await this.prisma.applicant.create({
          data: {
            userId: user.id,
            goal: ApplicantGoal.UNDECIDED,
            currentStage: 'WORKSPACE',
            consentGivenAt: new Date(),
            consentVersion: 'v1.0-google',
          },
        });
        applicantId = applicant.id;

        await this.prisma.profilePersonal.create({
          data: {
            applicantId: applicant.id,
            name: name || email.split('@')[0],
            email,
            nationality: 'Indian',
          },
        });

        const conversation = await this.prisma.conversation.create({
          data: {
            applicantId: applicant.id,
            status: 'ACTIVE',
          },
        });
        conversationId = conversation.id;

        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'AGENT',
            content: `Namaste ${name || ''}! Welcome to Educaro Compass. I am your AI Guide to Germany. Are you planning to study, pursue vocational training (Ausbildung), or work as a skilled professional?`,
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
          name: name || user.applicant?.personal?.name || user.email.split('@')[0],
          avatarUrl: user.avatarUrl,
          role: user.role,
          applicantId,
          conversationId,
          isGuest: false,
        },
      };
    }

    // 2. New user registration via Google
    const newUser = await this.prisma.user.create({
      data: {
        email,
        googleId,
        avatarUrl,
        role: UserRole.APPLICANT,
        locale: 'en',
        isGuest: false,
      },
    });

    const applicant = await this.prisma.applicant.create({
      data: {
        userId: newUser.id,
        goal: ApplicantGoal.UNDECIDED,
        currentStage: 'WORKSPACE',
        consentGivenAt: new Date(),
        consentVersion: 'v1.0-google',
      },
    });

    await this.prisma.profilePersonal.create({
      data: {
        applicantId: applicant.id,
        name: name || email.split('@')[0],
        email,
        nationality: 'Indian',
      },
    });

    await this.prisma.profileFact.create({
      data: {
        applicantId: applicant.id,
        fieldPath: 'personal.name',
        value: name || email.split('@')[0],
        provenance: 'APPLICANT_PROVIDED',
        confidence: 1.0,
        evidenceType: 'CHAT',
      },
    });

    const conversation = await this.prisma.conversation.create({
      data: {
        applicantId: applicant.id,
        status: 'ACTIVE',
      },
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AGENT',
        content: `Namaste ${name || ''}! Welcome to Educaro Compass. I am your AI Guide to Germany. Are you planning to study, pursue vocational training (Ausbildung), or work as a skilled professional?`,
        uiHints: {
          quickReplies: [
            'Study (Bachelor / Master)',
            'Ausbildung (Vocational Training)',
            'Skilled Work / Chancenkarte',
          ],
        },
      },
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: name || email.split('@')[0],
        avatarUrl,
        role: newUser.role,
        applicantId: applicant.id,
        conversationId: conversation.id,
        isGuest: false,
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
