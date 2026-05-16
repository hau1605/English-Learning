import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
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
import { ProgressService } from '../services/progress.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('stats')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get user progress stats' })
  @ApiResponse({
    status: 200,
    description: 'Progress stats retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProgressStats(@CurrentUser('id') userId: string) {
    const progress = await this.progressService.getUserProgress(userId);
    if (!progress) {
      throw new NotFoundException('User not found');
    }
    return progress;
  }

  @Get('daily')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get daily progress' })
  @ApiResponse({
    status: 200,
    description: 'Daily progress retrieved successfully',
  })
  async getDailyProgress(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.progressService.getDailyProgress(userId, targetDate);
  }

  @Get('weekly')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get weekly progress' })
  @ApiResponse({
    status: 200,
    description: 'Weekly progress retrieved successfully',
  })
  async getWeeklyProgress(@CurrentUser('id') userId: string) {
    return this.progressService.getWeeklyProgress(userId);
  }

  @Get('achievements')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({
    status: 200,
    description: 'Achievements retrieved successfully',
  })
  async getAchievements(@CurrentUser('id') userId: string) {
    const achievements = await this.progressService.getUserAchievements(userId);
    const unlocked = achievements.filter((a: any) => a.isUnlocked);
    return {
      achievements,
      totalUnlocked: unlocked.length,
      totalAvailable: achievements.length,
    };
  }

  @Get('check-achievements')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOperation({ summary: 'Check and award new achievements' })
  @ApiResponse({
    status: 200,
    description: 'Achievements checked successfully',
  })
  async checkAchievements(@CurrentUser('id') userId: string) {
    const newAchievements = await this.progressService.checkAndAwardAchievements(userId);
    return {
      newAchievements,
      count: newAchievements.length,
    };
  }
}
