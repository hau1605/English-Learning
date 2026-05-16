import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export class UploadMediaDto {
  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ example: 'vocabulary' })
  @IsOptional()
  @IsString()
  folder?: string;
}

export class MediaResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uploads/2024/01/image-uuid.jpg' })
  fileKey: string;

  @ApiProperty({ example: 'https://cdn.example.com/uploads/2024/01/image-uuid.jpg' })
  fileUrl: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiProperty({ example: 'english-learning' })
  bucket: string;
}

export class UploadResultDto {
  @ApiProperty({ type: MediaResponseDto })
  media: MediaResponseDto;

  @ApiProperty({ example: 'https://cdn.example.com/uploads/2024/01/image-uuid.jpg' })
  url: string;
}
