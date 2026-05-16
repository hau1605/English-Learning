import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSpeakingDto {
  @ApiProperty({ example: 'https://storage.example.com/audio/xxx.wav' })
  @IsString()
  audioUrl: string;
}
