import { Controller, Post, Get, Body, UseGuards, Req, Res, HttpCode, HttpStatus, Param, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@/modules/auth/services/auth.service';
import { PasswordResetService } from '@/modules/auth/services/password-reset.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { RESPONSE_MESSAGES } from '@/common/constants/response-messages';
import { AuditService } from '@/modules/audit/audit.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    await this.auditService.log({
      action: 'auth.register',
      entityType: 'user',
      entityId: result.userId,
      metadata: { email: dto.email },
      context: this.auditContext(req, result.userId),
    });

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: RESPONSE_MESSAGES.AUTH.REGISTER_SUCCESS,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        userId: result.userId,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.login(dto);

      await this.auditService.log({
        action: 'auth.login',
        entityType: 'user',
        entityId: result.userId,
        metadata: { email: dto.email },
        context: this.auditContext(req, result.userId),
      });

      this.setRefreshTokenCookie(res, result.refreshToken);

      return {
        message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          userId: result.userId,
          emailVerified: result.emailVerified,
        },
        warning: result.warning,
      };
    } catch (error) {
      await this.auditService.log({
        action: 'auth.login_failed',
        entityType: 'user',
        metadata: { email: dto.email },
        context: this.auditContext(req),
      });
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: Request & { user: { id: string; sessionId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id, req.user.sessionId);
    await this.auditService.log({
      action: 'auth.logout',
      entityType: 'session',
      entityId: req.user.sessionId,
      context: this.auditContext(req, req.user.id),
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(
    @Req() req: Request & { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.id);
    await this.auditService.log({
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: req.user.id,
      context: this.auditContext(req, req.user.id),
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out from all devices' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token cookie required',
      });
    }

    const result = await this.authService.refreshTokens(refreshToken);
    await this.auditService.log({
      action: 'auth.refresh',
      entityType: 'user',
      entityId: result.userId,
      context: this.auditContext(req, result.userId),
    });

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: RESPONSE_MESSAGES.AUTH.REFRESH_SUCCESS,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  async getSessions(@Req() req: Request & { user: { id: string } }) {
    const sessions = await this.authService.getActiveSessions(req.user.id);

    return {
      message: 'Active sessions retrieved',
      data: sessions,
    };
  }

  @Post('sessions/:sessionId/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(
    @Req() req: Request & { user: { id: string } },
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(sessionId);
    await this.auditService.log({
      action: 'auth.session_revoke',
      entityType: 'session',
      entityId: sessionId,
      context: this.auditContext(req, req.user.id),
    });

    return { message: 'Session revoked' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body('email') email: string) {
    await this.passwordResetService.requestPasswordReset(email);
    return {
      message: 'If an account with that email exists, a new password has been sent.',
    };
  }

  @Get('google')
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Google' })
  async googleAuth() {
    // Passport will redirect to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as { id: string; email: string; fullName: string };

    if (!user || !user.id) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const tokens = await this.authService.generateTokensForOAuth(user.id);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3681';
    const redirectUrl = new URL(`${frontendUrl}/google/callback`);
    redirectUrl.searchParams.set('access_token', tokens.accessToken);
    redirectUrl.searchParams.set('expires_in', tokens.expiresIn.toString());

    return res.redirect(redirectUrl.toString());
  }

  private auditContext(req: Request, actorId?: string) {
    return {
      actorId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
