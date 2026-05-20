import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { Public } from '@/modules/auth/decorators/public.decorator';

@ApiTags('verification')
@Controller('auth')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async verifyEmail(@Body('token') token: string) {
    const result = await this.verificationService.verifyEmail(token);
    return {
      success: result.success,
      message: result.message,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent if email exists' })
  async resendVerification(@Body('email') email: string) {
    await this.verificationService.resendVerificationEmail(email);
    return {
      message: 'If an account with that email exists, a verification email has been sent.',
    };
  }
}
