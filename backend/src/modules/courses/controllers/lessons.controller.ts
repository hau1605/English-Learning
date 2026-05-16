import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { LessonsService } from '../services/lessons.service';
import { CreateLessonDto, UpdateLessonDto } from '../dto/lesson.dto';

@ApiTags('lessons')
@Controller('sections/:sectionId/lessons')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all lessons for a section' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  async findAll(@Param('sectionId', ParseUUIDPipe) sectionId: string) {
    return this.lessonsService.findAllBySection(sectionId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.findById(id);
  }

  @Post()
  @Permissions('lesson.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new lesson' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async create(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(sectionId, dto);
  }

  @Patch(':id')
  @Permissions('lesson.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('lesson.delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.delete(id);
  }
}

@ApiTags('lessons')
@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LessonAliasesController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('courses/:courseId/sections/:sectionId/lessons')
  @Public()
  @ApiOperation({ summary: 'Get all lessons for a course section' })
  async findAllForCourseSection(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.lessonsService.findAllBySection(sectionId);
  }

  @Get('lessons/:id')
  @Public()
  @ApiOperation({ summary: 'Get lesson by ID' })
  async findLessonById(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.findById(id);
  }

  @Post('lessons/:id/view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark lesson as viewed by current user' })
  async markLessonViewed(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    await this.lessonsService.markAsViewed(req.user.id, id);
    return { lessonId: id };
  }

  @Patch('lessons/:id')
  @Permissions('lesson.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson' })
  async updateLessonById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, dto);
  }

  @Delete('lessons/:id')
  @Permissions('lesson.delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lesson' })
  async deleteLessonById(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.delete(id);
  }
}
