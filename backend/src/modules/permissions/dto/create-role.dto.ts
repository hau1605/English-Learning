import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Content Manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'content_manager' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Can manage lessons and quizzes' })
  @IsOptional()
  @IsString()
  description?: string;
}
