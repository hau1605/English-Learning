import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Complete English Grammar' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Master English grammar from beginner to advanced' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.INTERMEDIATE })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Complete English Grammar - Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ example: 'https://example.com/new-thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}
