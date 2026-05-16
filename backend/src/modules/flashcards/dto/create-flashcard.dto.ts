import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFlashcardDto {
  @ApiPropertyOptional()
  @IsString()
  vocabularyId: string;

  @ApiPropertyOptional()
  @IsString()
  frontContent: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;
}
