import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'lesson.create' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Create new lessons' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'lesson' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  action: string;
}
