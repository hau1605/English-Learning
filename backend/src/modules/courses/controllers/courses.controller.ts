import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async findAll(
    @Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    @Query('level') level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<import('../services/courses.service').CourseWithMeta> {
    return this.coursesService.findAll({
      status,
      level,
      search,
      page,
      limit,
    });
  }

  @Get('published')
  @Public()
  @ApiOperation({ summary: 'Get published courses' })
  @ApiResponse({ status: 200, description: 'Published courses retrieved' })
  async findPublished() {
    return this.coursesService.findPublished();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findById(id);
  }

  @Get(':id/progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress in course' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.coursesService.getCourseProgress(req.user.id, id);
  }

  @Post()
  @Permissions('course.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(':id')
  @Permissions('course.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, dto);
  }

  @Patch(':id/publish')
  @Permissions('course.publish')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish course' })
  @ApiResponse({ status: 200, description: 'Course published successfully' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.publish(id);
  }

  @Delete(':id')
  @Permissions('course.delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.delete(id);
  }
}
