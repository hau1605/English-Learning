import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SafeUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  xp: number;

  @ApiProperty()
  streakDays: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ type: [String] })
  roleCodes?: string[];
}
