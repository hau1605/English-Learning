import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({ example: 'Lesson 1: What is English?' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Introduction to the English language' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: LessonType, example: LessonType.READING })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiPropertyOptional({ example: 'Full lesson content here...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  estimatedTime?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Lesson 1: What is English? - Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: LessonType })
  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @ApiPropertyOptional({ example: 'Updated lesson content...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-video.mp4' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  estimatedTime?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
