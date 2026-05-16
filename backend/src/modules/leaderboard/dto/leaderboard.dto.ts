import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

export class GetLeaderboardDto {
  @ApiPropertyOptional({ enum: LeaderboardPeriod, default: LeaderboardPeriod.WEEKLY })
  @IsOptional()
  @IsEnum(LeaderboardPeriod)
  period?: LeaderboardPeriod = LeaderboardPeriod.WEEKLY;

  @ApiPropertyOptional({ default: 100, description: 'Number of results to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 100;
}

export class LeaderboardEntryDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ example: 1500 })
  xp: number;

  @ApiProperty({ example: 5 })
  level: number;

  @ApiPropertyOptional({ example: 7 })
  streakDays?: number;

  @ApiProperty({ example: 1 })
  rank: number;

  @ApiPropertyOptional({ example: 100 })
  weekXp?: number;

  @ApiPropertyOptional({ example: 500 })
  monthXp?: number;
}

export class UserRankDto {
  @ApiProperty({ example: 42 })
  rank: number;

  @ApiProperty({ example: 1500 })
  xp: number;

  @ApiProperty({ example: 5 })
  level: number;

  @ApiProperty({ example: 100 })
  totalUsers: number;

  @ApiPropertyOptional({ type: LeaderboardEntryDto })
  previousRank?: LeaderboardEntryDto;

  @ApiPropertyOptional({ type: LeaderboardEntryDto })
  nextRank?: LeaderboardEntryDto;
}
