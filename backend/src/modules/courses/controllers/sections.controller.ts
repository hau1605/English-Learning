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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { CourseSectionsService } from '../services/sections.service';
import { CreateSectionDto, UpdateSectionDto } from '../dto/section.dto';

@ApiTags('sections')
@Controller('courses/:courseId/sections')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CourseSectionsController {
  constructor(private readonly sectionsService: CourseSectionsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all sections for a course' })
  @ApiResponse({ status: 200, description: 'Sections retrieved successfully' })
  async findAll(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.sectionsService.findAllByCourse(courseId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get section by ID' })
  @ApiResponse({ status: 200, description: 'Section retrieved successfully' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.sectionsService.findById(id);
  }

  @Post()
  @Permissions('section.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionsService.create(courseId, dto);
  }

  @Patch(':id')
  @Permissions('section.update')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('section.delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete section' })
  @ApiResponse({ status: 204, description: 'Section deleted successfully' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.sectionsService.delete(id);
  }
}
