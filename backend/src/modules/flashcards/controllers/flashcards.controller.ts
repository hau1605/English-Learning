import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardsService } from '@/modules/flashcards/services/flashcards.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ReviewFlashcardDto } from '@/modules/flashcards/dto/review-flashcard.dto';
import { CreateFlashcardDto, UpdateFlashcardDto, FlashcardQueryDto } from '@/modules/flashcards/dto/flashcard.dto';

@ApiTags('flashcards')
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  // ========== PUBLIC/USER ENDPOINTS ==========

  @Get('due')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get due flashcards for review' })
  @ApiResponse({ status: 200, description: 'Due cards retrieved' })
  async getDueCards(
    @Req() req: Request & { user: { id: string } },
    @Query('limit') limit?: number,
  ) {
    const cards = await this.flashcardsService.getDueCards(req.user.id, limit || 20);
    return {
      message: 'Due cards retrieved',
      data: cards,
    };
  }

  @Post('review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard reviewed' })
  async review(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: ReviewFlashcardDto,
  ) {
    const result = await this.flashcardsService.reviewFlashcard(req.user.id, dto);
    return {
      message: 'Flashcard reviewed',
      data: result,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get flashcard statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@Req() req: Request & { user: { id: string } }) {
    const stats = await this.flashcardsService.getStats(req.user.id);
    return {
      message: 'Stats retrieved',
      data: stats,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all flashcards for user' })
  @ApiResponse({ status: 200, description: 'Flashcards retrieved' })
  async getAll(
    @Req() req: Request & { user: { id: string } },
    @Query('topicId') topicId?: string,
  ) {
    const flashcards = await this.flashcardsService.getAllFlashcards(req.user.id, topicId);
    return {
      message: 'Flashcards retrieved',
      data: flashcards,
    };
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset flashcard progress' })
  @ApiResponse({ status: 200, description: 'Progress reset' })
  async resetProgress(
    @Req() req: Request & { user: { id: string } },
    @Body() { flashcardId }: { flashcardId?: string },
  ) {
    await this.flashcardsService.resetProgress(req.user.id, flashcardId);
    return {
      message: 'Progress reset',
    };
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get('admin/flashcards')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all flashcards (admin)' })
  @ApiResponse({ status: 200, description: 'Flashcards retrieved' })
  async getAllAdmin(@Query() query: FlashcardQueryDto) {
    const result = await this.flashcardsService.getFlashcardsAdmin(query);
    return {
      message: 'Flashcards retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('admin/flashcards/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get flashcard by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Flashcard retrieved' })
  async getByIdAdmin(@Param('id') id: string) {
    const flashcard = await this.flashcardsService.getFlashcardById(id);
    return {
      message: 'Flashcard retrieved',
      data: flashcard,
    };
  }

  @Post('admin/flashcards')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created' })
  async create(@Body() dto: CreateFlashcardDto) {
    const flashcard = await this.flashcardsService.createFlashcard(dto);
    return {
      message: 'Flashcard created',
      data: flashcard,
    };
  }

  @Post('admin/flashcards/bulk')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple flashcards' })
  @ApiResponse({ status: 201, description: 'Flashcards created' })
  async createBulk(@Body() dtos: CreateFlashcardDto[]) {
    const flashcards = await this.flashcardsService.createBulkFlashcards(dtos);
    return {
      message: `${flashcards.count} flashcards created`,
      data: flashcards,
    };
  }

  @Put('admin/flashcards/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateFlashcardDto) {
    const flashcard = await this.flashcardsService.updateFlashcard(id, dto);
    return {
      message: 'Flashcard updated',
      data: flashcard,
    };
  }

  @Delete('admin/flashcards/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard deleted' })
  async delete(@Param('id') id: string) {
    await this.flashcardsService.deleteFlashcard(id);
    return {
      message: 'Flashcard deleted',
    };
  }

  @Post('admin/vocabularies/:vocabularyId/generate-flashcard')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('flashcard.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate flashcard from vocabulary' })
  @ApiResponse({ status: 201, description: 'Flashcard generated' })
  async generateFromVocabulary(@Param('vocabularyId') vocabularyId: string) {
    const flashcard = await this.flashcardsService.generateFlashcardFromVocabulary(vocabularyId);
    return {
      message: 'Flashcard generated',
      data: flashcard,
    };
  }
}
