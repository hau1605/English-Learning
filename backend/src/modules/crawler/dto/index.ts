import { IsArray, IsBoolean, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// DefinitionDto must be declared before VocabularyItemDto (which references it)
export class DefinitionDto {
  @ApiProperty({ example: 'A greeting' })
  @IsString()
  meaning: string;

  @ApiPropertyOptional({ example: 'Hello, how are you?' })
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional({ example: ['hi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @ApiPropertyOptional({ example: ['goodbye'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];
}

// GrammarExampleDto and GrammarExerciseDto must be declared before GrammarLessonDto
export class GrammarExampleDto {
  @ApiProperty({ example: 'I eat breakfast every morning.' })
  @IsString()
  sentence: string;

  @ApiPropertyOptional({ example: 'Subject + verb + object' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'Tôi ăn sáng mỗi sáng.' })
  @IsOptional()
  @IsString()
  translation?: string;
}

export class GrammarExerciseDto {
  @ApiProperty({ example: 'Complete: He _____ to school every day.' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ example: ['go', 'goes', 'going', 'went'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: 'goes' })
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional({ example: 'Third person singular uses goes' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class VocabularyItemDto {
  @ApiProperty({ example: 'hello' })
  @IsString()
  @MinLength(1)
  word: string;

  @ApiPropertyOptional({ example: '/həˈloʊ/' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ example: ['noun', 'verb'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partOfSpeech?: string[];

  @ApiPropertyOptional({ type: [DefinitionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefinitionDto)
  definitions?: DefinitionDto[];

  @ApiPropertyOptional({ example: ['Hello, world!'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  examples?: string[];

  @ApiPropertyOptional({ example: ['hi', 'hey'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @ApiPropertyOptional({ example: ['goodbye'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 5 })
  @IsOptional()
  difficulty?: number;

  @ApiPropertyOptional({ example: 'A1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class TopicItemDto {
  @ApiProperty({ example: 'Greetings' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'greetings' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: '👋' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'Common greetings and farewells' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class GrammarLessonDto {
  @ApiProperty({ example: 'Present Simple Tense' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'tenses' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'The present simple tense is used for...' })
  @IsString()
  explanation: string;

  @ApiPropertyOptional({ type: [GrammarExampleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrammarExampleDto)
  examples?: GrammarExampleDto[];

  @ApiPropertyOptional({ type: [GrammarExerciseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrammarExerciseDto)
  exercises?: GrammarExerciseDto[];

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 5 })
  @IsOptional()
  difficulty?: number;

  @ApiPropertyOptional({ example: 'A1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class ImportVocabularyDto {
  @ApiProperty({ description: 'List of vocabulary items to import', type: [VocabularyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemDto)
  items: VocabularyItemDto[];
}

export class ImportTopicsDto {
  @ApiProperty({ description: 'List of topics to import', type: [TopicItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicItemDto)
  topics: TopicItemDto[];
}

export class ImportGrammarDto {
  @ApiProperty({ description: 'List of grammar lessons to import', type: [GrammarLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrammarLessonDto)
  lessons: GrammarLessonDto[];
}

export class TriggerCrawlDto {
  @ApiProperty({ example: ['hello', 'world', 'computer'] })
  @IsArray()
  @IsString({ each: true })
  words: string[];

  @ApiPropertyOptional({ example: 'free_dictionary' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  pushToBackend?: boolean;
}

export class TriggerGrammarCrawlDto {
  @ApiPropertyOptional({ example: ['basic', 'intermediate'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  pushToBackend?: boolean;
}

export class CrawlJobResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;
}

export class CrawlSourceResponseDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  requiresBrowser: boolean;

  @ApiProperty()
  rateLimit: number;
}

export class CrawlLogResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sourceName: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  itemsCrawled: number;

  @ApiProperty()
  itemsAdded: number;

  @ApiProperty()
  itemsUpdated: number;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  durationMs: number;
}
