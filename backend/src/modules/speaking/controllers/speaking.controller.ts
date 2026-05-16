import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SpeakingService } from '@/modules/speaking/services/speaking.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { SubmitSpeakingDto } from '@/modules/speaking/dto/submit-speaking.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';

@ApiTags('speaking')
@Controller('speaking')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SpeakingController {
  constructor(private readonly speakingService: SpeakingService) {}

  @Get('exercises')
  @Public()
  @ApiOperation({ summary: 'Get speaking exercises' })
  @ApiResponse({ status: 200, description: 'Exercises retrieved' })
  async getExercises(
    @Query('lessonId') lessonId?: string,
    @Query('limit') limit?: number,
    @Query('difficulty') difficulty?: number,
  ) {
    const exercises = await this.speakingService.getExercises({ lessonId, limit, difficulty });
    return {
      message: 'Exercises retrieved',
      data: exercises,
    };
  }

  @Get('exercises/:id')
  @Public()
  @ApiOperation({ summary: 'Get speaking exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise retrieved' })
  async getExerciseById(@Param('id') id: string) {
    const exercise = await this.speakingService.getExerciseById(id);
    return {
      message: 'Exercise retrieved',
      data: exercise,
    };
  }

  @Post('exercises')
  @Permissions('lesson.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create speaking exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created' })
  async createExercise(@Body() dto: { title: string; textContent: string; lessonId?: string; difficulty?: number }) {
    const exercise = await this.speakingService.createExercise(dto);
    return {
      message: 'Exercise created',
      data: exercise,
    };
  }

  @Post('exercises/:id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit speaking attempt' })
  @ApiResponse({ status: 201, description: 'Attempt submitted' })
  async submitAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SubmitSpeakingDto,
  ) {
    const attempt = await this.speakingService.submitAttempt(userId, id, dto.audioUrl);
    return {
      message: 'Attempt submitted',
      data: attempt,
    };
  }

  @Get('attempts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attempt result' })
  @ApiResponse({ status: 200, description: 'Attempt result retrieved' })
  async getAttemptResult(@Param('id') id: string) {
    const attempt = await this.speakingService.getAttemptResult(id);
    return {
      message: 'Attempt result retrieved',
      data: attempt,
    };
  }

  @Get('attempts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get speaking attempts' })
  @ApiResponse({ status: 200, description: 'Attempts retrieved' })
  async getAttempts(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.speakingService.getAttempts(userId, { page, limit });
    return {
      message: 'Attempts retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get speaking stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@CurrentUser('id') userId: string) {
    const stats = await this.speakingService.getAttemptStats(userId);
    return {
      message: 'Stats retrieved',
      data: stats,
    };
  }
}
