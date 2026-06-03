import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum ExamSkillDto {
  LISTENING = "LISTENING",
  READING = "READING",
  WRITING = "WRITING",
  SPEAKING = "SPEAKING",
}

export enum ExamQuestionTypeDto {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  FILL_BLANK = "FILL_BLANK",
  TRUE_FALSE_NOT_GIVEN = "TRUE_FALSE_NOT_GIVEN",
  YES_NO_NOT_GIVEN = "YES_NO_NOT_GIVEN",
  MATCHING = "MATCHING",
  ORDERING = "ORDERING",
  ESSAY = "ESSAY",
  SPEAKING_RESPONSE = "SPEAKING_RESPONSE",
}

export enum ExamDifficultyDto {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  VERY_HARD = "VERY_HARD",
}

export enum ExamContentStatusDto {
  DRAFT = "DRAFT",
  REVIEW = "REVIEW",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum ExamPracticeSetTypeDto {
  PRACTICE_SET = "PRACTICE_SET",
  MINI_TEST = "MINI_TEST",
  FULL_TEST = "FULL_TEST",
}

export enum ExamPracticeAttemptModeDto {
  PRACTICE = "PRACTICE",
  TEST = "TEST",
  REVIEW_WRONG = "REVIEW_WRONG",
  REVIEW_SAVED = "REVIEW_SAVED",
}

export enum ExamReportReasonDto {
  WRONG_ANSWER = "WRONG_ANSWER",
  UNCLEAR_EXPLANATION = "UNCLEAR_EXPLANATION",
  AUDIO_ERROR = "AUDIO_ERROR",
  PASSAGE_ERROR = "PASSAGE_ERROR",
  TRANSLATION_ERROR = "TRANSLATION_ERROR",
  DUPLICATE = "DUPLICATE",
  INAPPROPRIATE = "INAPPROPRIATE",
  OTHER = "OTHER",
}

export class ExamPracticeQueryDto {
  @IsString()
  @IsOptional()
  examId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsEnum(ExamPracticeSetTypeDto)
  @IsOptional()
  type?: ExamPracticeSetTypeDto;

  @IsEnum(ExamDifficultyDto)
  @IsOptional()
  difficulty?: ExamDifficultyDto;

  @IsString()
  @IsOptional()
  topic?: string;

  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsOptional()
  page?: number;

  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsOptional()
  limit?: number;
}

export class CreateExamQuestionOptionDto {
  @IsString()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}

export class CreateExamQuestionDto {
  @IsString()
  @MaxLength(80)
  code!: string;

  @IsString()
  examId!: string;

  @IsString()
  sectionId!: string;

  @IsString()
  @IsOptional()
  passageId?: string;

  @IsEnum(ExamQuestionTypeDto)
  type!: ExamQuestionTypeDto;

  @IsString()
  prompt!: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsEnum(ExamDifficultyDto)
  @IsOptional()
  difficulty?: ExamDifficultyDto;

  @IsString()
  @IsOptional()
  cefrLevel?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  skillTag?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knowledgeTags?: string[];

  @IsString()
  @IsOptional()
  source?: string;

  @IsEnum(ExamContentStatusDto)
  @IsOptional()
  status?: ExamContentStatusDto;

  @IsString()
  @IsOptional()
  audioUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateExamQuestionOptionDto)
  @ArrayNotEmpty()
  options!: CreateExamQuestionOptionDto[];
}

export class CreateExamPassageDto {
  @IsString()
  examId!: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  @IsOptional()
  passageType?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsEnum(ExamDifficultyDto)
  @IsOptional()
  difficulty?: ExamDifficultyDto;

  @IsString()
  @IsOptional()
  source?: string;

  @IsEnum(ExamContentStatusDto)
  @IsOptional()
  status?: ExamContentStatusDto;
}

export class CreatePracticeSetDto {
  @IsString()
  examId!: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ExamPracticeSetTypeDto)
  @IsOptional()
  type?: ExamPracticeSetTypeDto;

  @IsNumber()
  @IsOptional()
  recommendedMinutes?: number;

  @IsEnum(ExamDifficultyDto)
  @IsOptional()
  difficulty?: ExamDifficultyDto;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsBoolean()
  @IsOptional()
  showExplanationImmediately?: boolean;

  @IsBoolean()
  @IsOptional()
  allowRetake?: boolean;

  @IsEnum(ExamContentStatusDto)
  @IsOptional()
  status?: ExamContentStatusDto;
}

export class AddPracticeSetQuestionDto {
  @IsString()
  questionId!: string;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsNumber()
  @IsOptional()
  points?: number;
}

export class StartPracticeAttemptDto {
  @IsEnum(ExamPracticeAttemptModeDto)
  @IsOptional()
  mode?: ExamPracticeAttemptModeDto;
}

export class SavePracticeAnswerDto {
  @IsString()
  questionId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptionIds?: string[];

  @IsString()
  @IsOptional()
  textAnswer?: string;

  @IsBoolean()
  @IsOptional()
  markedForReview?: boolean;
}

export class SavePracticeAnswersDto {
  @ValidateNested({ each: true })
  @Type(() => SavePracticeAnswerDto)
  @IsArray()
  answers!: SavePracticeAnswerDto[];
}

export class ReportExamQuestionDto {
  @IsEnum(ExamReportReasonDto)
  reason!: ExamReportReasonDto;

  @IsString()
  @IsOptional()
  message?: string;
}
