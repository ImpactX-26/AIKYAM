import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ApplicantGoal } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new applicant or consultant account' })
  async register(
    @Body()
    body: {
      email: string;
      password?: string;
      role?: UserRole;
      locale?: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with existing credentials' })
  async login(@Body() body: { email: string; password?: string }) {
    return this.authService.login(body);
  }

  @Post('google')
  @ApiOperation({ summary: 'Log in or register with Google account' })
  async google(
    @Body()
    body: {
      credential?: string;
      email?: string;
      name?: string;
      googleId?: string;
      avatarUrl?: string;
    },
  ) {
    return this.authService.googleLogin(body);
  }

  @Post('guest')
  @ApiOperation({ summary: 'Create an instant guest demo session with applicant profile' })
  async guest(@Body() body: { goal?: ApplicantGoal }) {
    return this.authService.createGuestSession(body.goal);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile and active conversation' })
  async me(@CurrentUser() user: any) {
    return this.authService.getMe(user.userId);
  }
}
