import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@/queues/queue.service';
import { SendWelcomeEmailDto, SendPasswordResetEmailDto, SendWeeklyReportDto } from '../dto/email.dto';
import {
  welcomeTemplate,
  passwordResetTemplate,
  weeklyReportTemplate,
  streakReminderTemplate,
  achievementTemplate,
} from '../templates/email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM_ADDRESS') || 'noreply@englishlearning.com';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'English Learning Platform';
  }

  async sendWelcomeEmail(dto: SendWelcomeEmailDto): Promise<void> {
    const subject = 'Welcome to English Learning Platform!';
    const html = this.compileTemplate(welcomeTemplate, {
      name: dto.name,
      verificationUrl: dto.verificationUrl,
    });

    await this.queueService.addEmailJob('welcome', {
      to: dto.email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html,
    });

    this.logger.log(`Welcome email queued for: ${dto.email}`);
  }

  async sendPasswordResetEmail(dto: SendPasswordResetEmailDto): Promise<void> {
    const subject = 'Password Reset Request';
    const html = this.compileTemplate(passwordResetTemplate, {
      name: dto.name,
      resetUrl: dto.resetUrl,
      expiresInMinutes: dto.expiresInMinutes || 15,
    });

    await this.queueService.addEmailJob('password_reset', {
      to: dto.email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html,
    });

    this.logger.log(`Password reset email queued for: ${dto.email}`);
  }

  async sendWeeklyReport(dto: SendWeeklyReportDto): Promise<void> {
    const subject = 'Your Weekly Learning Report';
    const html = this.compileTemplate(weeklyReportTemplate, {
      name: dto.name,
      stats: dto.stats || {
        xpEarned: 0,
        wordsLearned: 0,
        quizzesCompleted: 0,
        streakDays: 0,
        studyMinutes: 0,
      },
    });

    await this.queueService.addEmailJob('weekly_report', {
      to: dto.email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html,
    });

    this.logger.log(`Weekly report email queued for: ${dto.email}`);
  }

  async sendStreakReminder(email: string, name: string, streakDays: number): Promise<void> {
    const subject = "Don't Break Your Streak!";
    const html = this.compileTemplate(streakReminderTemplate, {
      name,
      streakDays,
      appUrl: this.configService.get<string>('APP_URL') || 'https://englishlearning.com',
    });

    await this.queueService.addEmailJob('streak_reminder', {
      to: email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html,
    });

    this.logger.log(`Streak reminder email queued for: ${email}`);
  }

  async sendAchievementEmail(email: string, name: string, achievementName: string, achievementDescription: string): Promise<void> {
    const subject = `Achievement Unlocked: ${achievementName}`;
    const html = this.compileTemplate(achievementTemplate, {
      name,
      achievementName,
      achievementDescription,
    });

    await this.queueService.addEmailJob('achievement', {
      to: email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html,
    });

    this.logger.log(`Achievement email queued for: ${email}`);
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    let compiled = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    }
    return compiled;
  }

  async sendEmailDirect(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`Sending email directly: ${subject} to ${to}`);
    // This would be implemented with nodemailer in production
    // For now, just log the email
    this.logger.debug(`Email content: ${html.substring(0, 200)}...`);
  }
}
