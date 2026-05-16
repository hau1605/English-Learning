import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlashcardRating } from '@/common/enums';

export class ReviewFlashcardDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  flashcardId: string;

  @ApiProperty({ enum: FlashcardRating, example: FlashcardRating.GOOD })
  @IsNumber()
  @Min(0)
  @Max(3)
  rating: FlashcardRating;
}
