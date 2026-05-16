import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFlashcardDto {
  @ApiProperty({ example: 'uuid-of-vocabulary' })
  @IsString()
  vocabularyId: string;

  @ApiProperty({ example: 'What does "accomplish" mean?' })
  @IsString()
  frontContent: string;

  @ApiProperty({ example: 'To succeed in doing something' })
  @IsString()
  backContent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Think about completing a task' })
  @IsOptional()
  @IsString()
  hint?: string;
}

export class UpdateFlashcardDto {
  @ApiPropertyOptional({ example: 'What does "accomplish" mean?' })
  @IsOptional()
  @IsString()
  frontContent?: string;

  @ApiPropertyOptional({ example: 'To succeed in doing something' })
  @IsOptional()
  @IsString()
  backContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Think about completing a task' })
  @IsOptional()
  @IsString()
  hint?: string;
}

export class FlashcardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;
}
