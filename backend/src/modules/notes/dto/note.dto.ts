import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export enum UserNoteType {
  VOCABULARY = "VOCABULARY",
  GRAMMAR = "GRAMMAR",
  PHRASE = "PHRASE",
  LESSON = "LESSON",
  QUIZ_MISTAKE = "QUIZ_MISTAKE",
  SPEAKING_FEEDBACK = "SPEAKING_FEEDBACK",
  CUSTOM = "CUSTOM",
}

export enum UserNoteSourceType {
  VOCABULARY = "VOCABULARY",
  GRAMMAR_LESSON = "GRAMMAR_LESSON",
  LESSON = "LESSON",
  QUIZ = "QUIZ",
  QUIZ_QUESTION = "QUIZ_QUESTION",
  SPEAKING_ATTEMPT = "SPEAKING_ATTEMPT",
}

export class CreateNoteDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(UserNoteType)
  @IsOptional()
  type?: UserNoteType;

  @IsEnum(UserNoteSourceType)
  @IsOptional()
  sourceType?: UserNoteSourceType;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsDateString()
  @IsOptional()
  reviewAt?: string;
}

export class UpdateNoteDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(UserNoteType)
  @IsOptional()
  type?: UserNoteType;

  @IsEnum(UserNoteSourceType)
  @IsOptional()
  sourceType?: UserNoteSourceType;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsDateString()
  @IsOptional()
  reviewAt?: string;
}

export class NotesQueryDto {
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsOptional()
  page?: number;

  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(UserNoteType)
  @IsOptional()
  type?: UserNoteType;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsEnum(UserNoteSourceType)
  @IsOptional()
  sourceType?: UserNoteSourceType;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @Transform(({ value }) =>
    value === undefined ? undefined : value === "true" || value === true,
  )
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @Transform(({ value }) =>
    value === undefined ? undefined : value === "true" || value === true,
  )
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class BulkDeleteNotesDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
