import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/modules/email/services/email.service';
import { hashPassword } from '@/common/utils';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3681';
  }

  async createVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const tokenHash = await hashPassword(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerification.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(`Verification token created for user: ${userId}`);
    return token;
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const verifications = await this.prisma.emailVerification.findMany({
      where: {
        verifiedAt: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const verification of verifications) {
      const isValid = await this.compareToken(token, verification.tokenHash);
      if (isValid) {
        if (verification.expiresAt < new Date()) {
          throw new BadRequestException('Verification link has expired');
        }

        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: verification.userId },
            data: { status: 'ACTIVE' },
          }),
          this.prisma.emailVerification.update({
            where: { id: verification.id },
            data: { verifiedAt: new Date() },
          }),
        ]);

        this.logger.log(`Email verified for user: ${verification.userId}`);
        return { success: true, message: 'Email verified successfully' };
      }
    }

    throw new NotFoundException('Invalid verification token');
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.log(`Resend verification requested for non-existent email: ${email}`);
      return;
    }

    if (user.status === 'ACTIVE') {
      this.logger.log(`Verification requested for already verified email: ${email}`);
      return;
    }

    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    const token = await this.createVerificationToken(user.id);
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    await this.emailService.sendWelcomeEmail({
      email: user.email,
      name: user.fullName,
      verificationUrl,
    });

    this.logger.log(`Verification email resent to: ${email}`);
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async compareToken(token: string, hash: string): Promise<boolean> {
    const { verifyPassword } = await import('@/common/utils');
    return verifyPassword(token, hash);
  }
}
