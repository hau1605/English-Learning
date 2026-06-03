import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({ example: 'Business English' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'business-english' })
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateVocabularyDto {
  @ApiProperty()
  @IsString()
  topicId: string;

  @ApiProperty({ example: 'accomplish' })
  @IsString()
  word: string;

  @ApiPropertyOptional({ example: '/əˈkʌmplɪʃ/' })
  @IsOptional()
  @IsString()
  pronunciation?: string;

  @ApiProperty({ example: 'to succeed in doing something' })
  @IsString()
  meaning: string;

  @ApiPropertyOptional({ example: 'She worked hard to accomplish her goals.' })
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ example: 'verb' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;
}

export class UpdateVocabularyDto {
  @ApiPropertyOptional({ example: 'accomplish' })
  @IsOptional()
  @IsString()
  word?: string;

  @ApiPropertyOptional({ example: '/əˈkʌmplɪʃ/' })
  @IsOptional()
  @IsString()
  pronunciation?: string;

  @ApiPropertyOptional({ example: 'to succeed in doing something' })
  @IsOptional()
  @IsString()
  meaning?: string;

  @ApiPropertyOptional({ example: 'She worked hard to accomplish her goals.' })
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ example: 'verb' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;
}

export class VocabularyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;
}

// ========== IMPORT / EXPORT DTOs ==========

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class ExportVocabularyQueryDto {
  @ApiPropertyOptional({ description: 'Topic ID to export vocabularies from' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Export format: csv or json', enum: ExportFormat, default: ExportFormat.CSV })
  @IsOptional()
  @IsString()
  format?: ExportFormat;

  @ApiPropertyOptional({ description: 'Include difficulty filter (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;
}

export class ImportVocabularyDto {
  @ApiProperty({ description: 'Topic ID to import vocabularies into' })
  @IsString()
  topicId: string;

  @ApiPropertyOptional({ description: 'Set difficulty for all imported vocabularies (overrides file values if provided)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  defaultDifficulty?: number;

  @ApiPropertyOptional({ description: 'Create topic if it does not exist' })
  @IsOptional()
  @IsString()
  createTopicIfNotExists?: string;
}

export class ImportResultDto {
  success: number;
  failed: number;
  errors: Array<{ row: number; word: string; error: string }>;
}
