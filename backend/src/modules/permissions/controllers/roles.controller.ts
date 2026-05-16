import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '@/modules/permissions/services/roles.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { CreateRoleDto } from '@/modules/permissions/dto/create-role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved' })
  async getAll() {
    const roles = await this.rolesService.getAllRoles();
    return {
      message: 'Roles retrieved',
      data: roles,
    };
  }

  @Get(':id')
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved' })
  async getById(@Param('id') id: string) {
    const role = await this.rolesService.getRoleById(id);
    return {
      message: 'Role retrieved',
      data: role,
    };
  }

  @Post()
  @Permissions('role.create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async create(@Body() dto: CreateRoleDto) {
    const role = await this.rolesService.createRole(dto);
    return {
      message: 'Role created',
      data: role,
    };
  }

  @Post(':roleId/permissions/:permissionId')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Add permission to role' })
  @ApiResponse({ status: 201, description: 'Permission added to role' })
  async addPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const result = await this.rolesService.addPermissionToRole(roleId, permissionId);
    return {
      message: 'Permission added to role',
      data: result,
    };
  }

  @Delete(':roleId/permissions/:permissionId')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed from role' })
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rolesService.removePermissionFromRole(roleId, permissionId);
    return {
      message: 'Permission removed from role',
    };
  }
}
