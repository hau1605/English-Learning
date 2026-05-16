import { IsInt, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetProgressStatsDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserProgressDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalXp: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  xpToNextLevel: number;

  @ApiProperty()
  streakDays: number;

  @ApiProperty()
  longestStreak: number;

  @ApiProperty()
  totalWordsLearned: number;

  @ApiProperty()
  totalFlashcardsReviewed: number;

  @ApiProperty()
  totalQuizzesCompleted: number;

  @ApiProperty()
  totalSpeakingMinutes: number;

  @ApiProperty()
  averageAccuracy: number;
}

export class DailyProgressDto {
  @ApiProperty({ example: '2024-01-01' })
  date: string;

  @ApiProperty({ example: 150 })
  xpEarned: number;

  @ApiProperty({ example: 10 })
  wordsLearned: number;

  @ApiProperty({ example: 20 })
  flashcardsReviewed: number;

  @ApiProperty({ example: 2 })
  quizzesCompleted: number;

  @ApiProperty({ example: 15 })
  studyMinutes: number;

  @ApiProperty({ example: true })
  streakContinued: boolean;
}

export class AchievementDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ example: 10 })
  xpReward: number;

  @ApiProperty({ example: 100 })
  requirement: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiPropertyOptional()
  unlockedAt?: string;

  @ApiProperty({ example: 50 })
  progress: number;
}

export class UserAchievementsDto {
  @ApiProperty({ type: [AchievementDto] })
  achievements: AchievementDto[];

  @ApiProperty({ example: 5 })
  totalUnlocked: number;

  @ApiProperty({ example: 15 })
  totalAvailable: number;
}

export class WeeklyProgressDto {
  @ApiProperty({ example: '2024-W01' })
  week: string;

  @ApiProperty({ example: 1050 })
  totalXp: number;

  @ApiProperty({ example: 70 })
  totalStudyMinutes: number;

  @ApiProperty({ example: 140 })
  totalFlashcardsReviewed: number;

  @ApiProperty({ example: 14 })
  totalQuizzesCompleted: number;

  @ApiProperty({ example: 5 })
  activeDays: number;
}
