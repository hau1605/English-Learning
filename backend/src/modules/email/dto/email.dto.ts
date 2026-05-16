import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  WEEKLY_REPORT = 'weekly_report',
  STREAK_REMINDER = 'streak_reminder',
  ACHIEVEMENT = 'achievement',
  QUIZ_RESULT = 'quiz_result',
}

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ enum: EmailTemplate, example: EmailTemplate.WELCOME })
  @IsEnum(EmailTemplate)
  template: EmailTemplate;

  @ApiPropertyOptional({ example: 'Welcome to English Learning Platform!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: { name: 'John Doe', verifyUrl: 'https://...' } })
  @IsOptional()
  data?: Record<string, any>;
}

export class SendWelcomeEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/verify?token=xxx' })
  @IsOptional()
  @IsString()
  verificationUrl?: string;
}

export class SendPasswordResetEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/reset-password?token=xxx' })
  @IsString()
  resetUrl: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  expiresInMinutes?: number;
}

export class SendWeeklyReportDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  stats?: {
    xpEarned: number;
    wordsLearned: number;
    quizzesCompleted: number;
    streakDays: number;
    studyMinutes: number;
  };
}
