import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getUserStats(@Req() req: Request & { user: { id: string } }) {
    const stats = await this.analyticsService.getUserStats(req.user.id);
    return {
      message: 'Stats retrieved',
      data: stats,
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  async getLeaderboard(
    @Query('type') type?: 'global' | 'weekly' | 'monthly',
    @Query('limit') limit?: number,
  ) {
    const leaderboard = await this.analyticsService.getLeaderboard(type || 'global', limit || 100);
    return {
      message: 'Leaderboard retrieved',
      data: leaderboard,
    };
  }
}
