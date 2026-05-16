import { IsString, IsOptional } from 'class-validator';
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
  difficulty?: number;

  @ApiPropertyOptional({ example: 'verb' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;
}
