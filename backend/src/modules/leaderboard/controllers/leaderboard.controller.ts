import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LeaderboardService } from '../services/leaderboard.service';
import { GetLeaderboardDto, LeaderboardPeriod, LeaderboardEntryDto, UserRankDto } from '../dto/leaderboard.dto';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get leaderboard rankings' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
    type: [LeaderboardEntryDto],
  })
  async getLeaderboard(@Query() dto: GetLeaderboardDto) {
    return this.leaderboardService.getLeaderboard(dto.period, dto.limit);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get current user rank' })
  @ApiResponse({
    status: 200,
    description: 'User rank retrieved successfully',
    type: UserRankDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyRank(@CurrentUser('id') userId: string) {
    const rank = await this.leaderboardService.getUserRank(userId);
    if (!rank) {
      throw new NotFoundException('User not found');
    }
    return rank;
  }

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top 10 users' })
  @ApiResponse({
    status: 200,
    description: 'Top users retrieved successfully',
    type: [LeaderboardEntryDto],
  })
  async getTopUsers() {
    return this.leaderboardService.getTopUsers(10);
  }

  @Get('position')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get current user position with context' })
  @ApiResponse({
    status: 200,
    description: 'User position retrieved successfully',
    type: LeaderboardEntryDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyPosition(@CurrentUser('id') userId: string) {
    const position = await this.leaderboardService.getUserPosition(userId);
    if (!position) {
      throw new NotFoundException('User not found');
    }
    return position;
  }
}
