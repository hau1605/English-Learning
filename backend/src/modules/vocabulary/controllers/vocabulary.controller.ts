import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VocabularyService } from '@/modules/vocabulary/services/vocabulary.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import {
  CreateTopicDto,
  UpdateTopicDto,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyQueryDto,
  ExportVocabularyQueryDto,
  ImportVocabularyDto,
  ExportFormat,
} from '@/modules/vocabulary/dto/vocabulary.dto';

@ApiTags('vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // ========== PUBLIC ENDPOINTS ==========

  @Public()
  @Get('topics')
  @ApiOperation({ summary: 'Get all topics' })
  @ApiResponse({ status: 200, description: 'Topics retrieved' })
  async getTopics() {
    const topics = await this.vocabularyService.getTopics();
    return {
      message: 'Topics retrieved',
      data: topics,
    };
  }

  @Public()
  @Get('topics/:slug')
  @ApiOperation({ summary: 'Get topic by slug with vocabularies' })
  @ApiResponse({ status: 200, description: 'Topic retrieved' })
  async getTopicBySlug(@Param('slug') slug: string) {
    const topic = await this.vocabularyService.getTopicBySlug(slug);
    return {
      message: 'Topic retrieved',
      data: topic,
    };
  }

  @Public()
  @Get('topics/:topicId/vocabularies')
  @ApiOperation({ summary: 'Get all vocabularies for a topic' })
  @ApiResponse({ status: 200, description: 'Vocabularies retrieved' })
  async getVocabulariesByTopic(@Param('topicId') topicId: string) {
    const vocabularies = await this.vocabularyService.getVocabulariesByTopic(topicId);
    return {
      message: 'Vocabularies retrieved',
      data: vocabularies,
    };
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search vocabularies' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string, @Query('limit') limit?: number) {
    const results = await this.vocabularyService.searchVocabularies(query, limit || 20);
    return {
      message: 'Search results',
      data: results,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vocabulary by ID' })
  @ApiResponse({ status: 200, description: 'Vocabulary retrieved' })
  async getById(@Param('id') id: string) {
    const vocabulary = await this.vocabularyService.getVocabularyById(id);
    return {
      message: 'Vocabulary retrieved',
      data: vocabulary,
    };
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get('admin/topics')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all topics (admin)' })
  @ApiResponse({ status: 200, description: 'Topics retrieved' })
  async getTopicsAdmin() {
    const topics = await this.vocabularyService.getTopicsAdmin();
    return {
      message: 'Topics retrieved',
      data: topics,
    };
  }

  @Post('admin/topics')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiResponse({ status: 201, description: 'Topic created' })
  async createTopic(@Body() dto: CreateTopicDto) {
    const topic = await this.vocabularyService.createTopic(dto);
    return {
      message: 'Topic created',
      data: topic,
    };
  }

  @Put('admin/topics/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a topic' })
  @ApiResponse({ status: 200, description: 'Topic updated' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    const topic = await this.vocabularyService.updateTopic(id, dto);
    return {
      message: 'Topic updated',
      data: topic,
    };
  }

  @Delete('admin/topics/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a topic' })
  @ApiResponse({ status: 200, description: 'Topic deleted' })
  async deleteTopic(@Param('id') id: string) {
    await this.vocabularyService.deleteTopic(id);
    return {
      message: 'Topic deleted',
    };
  }

  @Get('admin/vocabularies')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vocabularies (admin)' })
  @ApiResponse({ status: 200, description: 'Vocabularies retrieved' })
  async getVocabulariesAdmin(@Query() query: VocabularyQueryDto) {
    const result = await this.vocabularyService.getVocabulariesAdmin(query);
    return {
      message: 'Vocabularies retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post('admin/vocabularies')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new vocabulary' })
  @ApiResponse({ status: 201, description: 'Vocabulary created' })
  async create(@Body() dto: CreateVocabularyDto) {
    const vocabulary = await this.vocabularyService.createVocabulary(dto);
    return {
      message: 'Vocabulary created',
      data: vocabulary,
    };
  }

  @Put('admin/vocabularies/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a vocabulary' })
  @ApiResponse({ status: 200, description: 'Vocabulary updated' })
  async updateVocabulary(@Param('id') id: string, @Body() dto: UpdateVocabularyDto) {
    const vocabulary = await this.vocabularyService.updateVocabulary(id, dto);
    return {
      message: 'Vocabulary updated',
      data: vocabulary,
    };
  }

  @Delete('admin/vocabularies/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a vocabulary' })
  @ApiResponse({ status: 200, description: 'Vocabulary deleted' })
  async deleteVocabulary(@Param('id') id: string) {
    await this.vocabularyService.deleteVocabulary(id);
    return {
      message: 'Vocabulary deleted',
    };
  }

  @Post('admin/vocabularies/bulk')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple vocabularies' })
  @ApiResponse({ status: 201, description: 'Vocabularies created' })
  async createBulk(@Body() dtos: CreateVocabularyDto[]) {
    const result = await this.vocabularyService.createBulkVocabulary(dtos);
    return {
      message: `${result.count} vocabularies created`,
      data: result,
    };
  }

  // ========== IMPORT / EXPORT ENDPOINTS ==========

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export vocabularies to CSV/JSON' })
  @ApiResponse({ status: 200, description: 'File download' })
  async exportVocabulary(@Res() res: Response, @Query() query: ExportVocabularyQueryDto) {
    const { data, filename, mimeType } = await this.vocabularyService.exportVocabulary({
      topicId: query.topicId,
      format: query.format || ExportFormat.CSV,
      difficulty: query.difficulty,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('vocabulary.create')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import vocabularies from CSV/JSON file' })
  @ApiResponse({ status: 201, description: 'Import result' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Vocabulary file (CSV or JSON)',
        },
        topicId: {
          type: 'string',
          description: 'Target topic ID',
        },
        defaultDifficulty: {
          type: 'number',
          description: 'Default difficulty level (1-5)',
        },
        createTopicIfNotExists: {
          type: 'string',
          description: 'Create topic with this name if topicId not found',
        },
      },
      required: ['file', 'topicId'],
    },
  })
  async importVocabulary(
    @UploadedFile() file: any,
    @Body() dto: ImportVocabularyDto,
  ) {
    if (!file) {
      return {
        message: 'No file uploaded',
        data: { success: 0, failed: 0, errors: [{ row: 0, word: '', error: 'File is required' }] },
      };
    }

    const result = await this.vocabularyService.importVocabulary({
      fileBuffer: file.buffer,
      topicId: dto.topicId,
      defaultDifficulty: dto.defaultDifficulty,
      createTopicIfNotExists: dto.createTopicIfNotExists,
    });

    return {
      message: `Import completed: ${result.success} succeeded, ${result.failed} failed`,
      data: result,
    };
  }
}
