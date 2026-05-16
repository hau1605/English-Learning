import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GrammarService } from '@/modules/grammar/services/grammar.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('grammar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all grammar categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    const categories = await this.grammarService.getCategories();
    return {
      message: 'Categories retrieved',
      data: categories,
    };
  }

  @Get('lessons/:slug')
  @ApiOperation({ summary: 'Get grammar lesson by slug' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved' })
  async getLessonBySlug(@Param('slug') slug: string) {
    const lesson = await this.grammarService.getLessonBySlug(slug);
    return {
      message: 'Lesson retrieved',
      data: lesson,
    };
  }

  @Get('categories/:categoryId/lessons')
  @ApiOperation({ summary: 'Get lessons by category' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved' })
  async getLessonsByCategory(@Param('categoryId') categoryId: string) {
    const lessons = await this.grammarService.getLessonsByCategory(categoryId);
    return {
      message: 'Lessons retrieved',
      data: lessons,
    };
  }
}
