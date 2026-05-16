import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: 'Chapter 1: Introduction' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Introduction to the basics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class UpdateSectionDto {
  @ApiPropertyOptional({ example: 'Chapter 1: Introduction - Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
