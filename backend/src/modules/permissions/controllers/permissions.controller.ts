import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from '@/modules/permissions/services/permissions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { CreatePermissionDto } from '@/modules/permissions/dto/create-permission.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('permission.view')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  async getAll() {
    const permissions = await this.permissionsService.getAllPermissions();
    return {
      message: 'Permissions retrieved',
      data: permissions,
    };
  }

  @Post()
  @Permissions('permission.create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created' })
  async create(@Body() dto: CreatePermissionDto) {
    const permission = await this.permissionsService.createPermission(dto);
    return {
      message: 'Permission created',
      data: permission,
    };
  }
}
