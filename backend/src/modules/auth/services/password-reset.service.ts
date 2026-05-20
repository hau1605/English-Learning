import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/modules/email/services/email.service';
import { hashPassword } from '@/common/utils';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3681';
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const newPassword = this.generateSecurePassword();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(newPassword),
        },
      });

      await tx.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: await hashPassword(newPassword),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    });

    await this.emailService.sendPasswordResetEmail({
      email: user.email,
      name: user.fullName,
      resetUrl: `${this.frontendUrl}/login`,
      expiresInMinutes: 10,
    });

    this.logger.log(`Password reset processed for: ${email}`);
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const randomValues = new Uint32Array(16);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(randomValues[i] % chars.length);
    }
    
    return password;
  }
}
