import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from './create-course.dto';

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
