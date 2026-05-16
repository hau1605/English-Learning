import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QuizAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  answerIds: string[];
}

export class SubmitQuizDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
