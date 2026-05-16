import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from '@/modules/quiz/services/quiz.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { SubmitQuizDto } from '@/modules/quiz/dto/submit-quiz.dto';
import { QuizQueryDto, CreateQuizDto, UpdateQuizDto, CreateQuizQuestionDto, UpdateQuizQuestionDto } from '@/modules/quiz/dto/quiz.dto';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ========== PUBLIC ENDPOINTS ==========

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved' })
  async getAll(
    @Query('lessonId') lessonId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    const quizzes = await this.quizService.getQuizzes({ lessonId, type, limit });
    return {
      message: 'Quizzes retrieved',
      data: quizzes,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved' })
  async getById(@Param('id') id: string) {
    const quiz = await this.quizService.getQuizById(id);
    return {
      message: 'Quiz retrieved',
      data: quiz,
    };
  }

  // ========== USER ENDPOINTS ==========

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getHistory(
    @Req() req: Request & { user: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.quizService.getQuizHistory(req.user.id, { page, limit });
    return {
      message: 'History retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz attempt details' })
  @ApiResponse({ status: 200, description: 'Attempt retrieved' })
  async getAttempt(
    @Req() req: Request & { user: { id: string } },
    @Param('attemptId') attemptId: string,
  ) {
    const attempt = await this.quizService.getQuizAttempt(req.user.id, attemptId);
    return {
      message: 'Attempt retrieved',
      data: attempt,
    };
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  @ApiResponse({ status: 200, description: 'Quiz submitted' })
  async submit(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    const result = await this.quizService.submitQuiz(req.user.id, id, dto.answers);
    return {
      message: 'Quiz submitted',
      data: result,
    };
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get('admin/quizzes')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quizzes (admin)' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved' })
  async getAllAdmin(@Query() query: QuizQueryDto) {
    const result = await this.quizService.getQuizzesAdmin(query);
    return {
      message: 'Quizzes retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post('admin/quizzes')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  async create(@Body() dto: CreateQuizDto) {
    const quiz = await this.quizService.createQuiz(dto);
    return {
      message: 'Quiz created',
      data: quiz,
    };
  }

  @Put('admin/quizzes/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiResponse({ status: 200, description: 'Quiz updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    const quiz = await this.quizService.updateQuiz(id, dto);
    return {
      message: 'Quiz updated',
      data: quiz,
    };
  }

  @Delete('admin/quizzes/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted' })
  async delete(@Param('id') id: string) {
    await this.quizService.deleteQuiz(id);
    return {
      message: 'Quiz deleted',
    };
  }

  @Post('admin/quizzes/:id/questions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a question to quiz' })
  @ApiResponse({ status: 201, description: 'Question added' })
  async addQuestion(@Param('id') quizId: string, @Body() dto: CreateQuizQuestionDto) {
    const question = await this.quizService.addQuestion(quizId, dto);
    return {
      message: 'Question added',
      data: question,
    };
  }

  @Put('admin/quizzes/:id/questions/:questionId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    const question = await this.quizService.updateQuestion(questionId, dto);
    return {
      message: 'Question updated',
      data: question,
    };
  }

  @Delete('admin/quizzes/:id/questions/:questionId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('quiz.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.quizService.deleteQuestion(questionId);
    return {
      message: 'Question deleted',
    };
  }
}
