import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'vocabulary' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Vocabulary' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ example: 'BookOpen' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: '/vocabulary' })
  @IsString()
  path: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: ['USER', 'ADMIN'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[];
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 'vocabulary' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Vocabulary' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'BookOpen' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '/vocabulary' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: ['USER', 'ADMIN'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[];
}

export class ReorderMenuItemDto {
  @ApiProperty({ example: 'uuid-of-menu-item' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}
