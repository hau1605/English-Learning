import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '@/modules/admin/services/admin.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { AuditService } from '@/modules/audit/audit.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  // ========== DASHBOARD ==========

  @Get('dashboard')
  @Permissions('admin.view')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return {
      message: 'Stats retrieved',
      data: stats,
    };
  }

  @Get('dashboard/analytics')
  @Permissions('admin.view')
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalyticsOverview() {
    const analytics = await this.adminService.getAnalyticsOverview();
    return {
      message: 'Analytics retrieved',
      data: analytics,
    };
  }

  @Get('activity')
  @Permissions('admin.view')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Activity retrieved' })
  async getRecentActivity(@Query('limit') limit?: number) {
    const activity = await this.adminService.getRecentActivity(limit || 20);
    return {
      message: 'Activity retrieved',
      data: activity,
    };
  }

  // ========== USER MANAGEMENT ==========

  @Get('users')
  @Permissions('user.view')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getUsers({ page, limit, search, status });
    return {
      message: 'Users retrieved',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post('users/:userId/roles')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  async assignRole(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() { roleCode }: { roleCode: string },
  ) {
    const result = await this.adminService.assignRole(userId, roleCode);
    await this.auditService.log({
      action: 'admin.user.assign_role',
      entityType: 'user',
      entityId: userId,
      metadata: { roleCode },
      context: this.auditContext(req),
    });
    return {
      message: 'Role assigned',
      data: result,
    };
  }

  @Delete('users/:userId/roles/:roleCode')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  async removeRole(
    @Req() req: any,
    @Param('userId') userId: string,
    @Param('roleCode') roleCode: string,
  ) {
    await this.adminService.removeRole(userId, roleCode);
    await this.auditService.log({
      action: 'admin.user.remove_role',
      entityType: 'user',
      entityId: userId,
      metadata: { roleCode },
      context: this.auditContext(req),
    });
    return {
      message: 'Role removed',
    };
  }

  @Post('users/:userId/suspend')
  @Permissions('user.suspend')
  @ApiOperation({ summary: 'Suspend user' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  async suspendUser(@Req() req: any, @Param('userId') userId: string) {
    const user = await this.adminService.suspendUser(userId);
    await this.auditService.log({
      action: 'admin.user.suspend',
      entityType: 'user',
      entityId: userId,
      context: this.auditContext(req),
    });
    return {
      message: 'User suspended',
      data: user,
    };
  }

  @Post('users/:userId/activate')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated' })
  async activateUser(@Req() req: any, @Param('userId') userId: string) {
    const user = await this.adminService.activateUser(userId);
    await this.auditService.log({
      action: 'admin.user.activate',
      entityType: 'user',
      entityId: userId,
      context: this.auditContext(req),
    });
    return {
      message: 'User activated',
      data: user,
    };
  }

  @Delete('users/:userId')
  @Permissions('user.delete')
  @ApiOperation({ summary: 'Delete user (soft)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async deleteUser(@Req() req: any, @Param('userId') userId: string) {
    await this.adminService.deleteUser(userId);
    await this.auditService.log({
      action: 'admin.user.delete',
      entityType: 'user',
      entityId: userId,
      context: this.auditContext(req),
    });
    return {
      message: 'User deleted',
    };
  }

  // ========== REPORTS ==========

  @Get('reports/user-engagement')
  @Permissions('report.view')
  @ApiOperation({ summary: 'Get user engagement report' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  async getUserEngagementReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.adminService.getUserEngagementReport({ startDate, endDate });
    return {
      message: 'Report retrieved',
      data: report,
    };
  }

  @Get('reports/quiz-performance')
  @Permissions('report.view')
  @ApiOperation({ summary: 'Get quiz performance report' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  async getQuizPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.adminService.getQuizPerformanceReport({ startDate, endDate });
    return {
      message: 'Report retrieved',
      data: report,
    };
  }

  @Get('reports/learning-progress')
  @Permissions('report.view')
  @ApiOperation({ summary: 'Get learning progress report' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  async getLearningProgressReport() {
    const report = await this.adminService.getLearningProgressReport();
    return {
      message: 'Report retrieved',
      data: report,
    };
  }

  @Get('reports/export/users')
  @Permissions('report.export')
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 200, description: 'Data exported' })
  async exportUserData() {
    const data = await this.adminService.exportUserData();
    return {
      message: 'Data exported',
      data,
    };
  }

  // ========== SETTINGS ==========

  @Get('settings')
  @Permissions('settings.view')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSystemSettings() {
    const settings = await this.adminService.getSystemSettings();
    return {
      message: 'Settings retrieved',
      data: settings,
    };
  }

  @Put('settings/:key')
  @Permissions('settings.update')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  async updateSystemSetting(
    @Req() req: any,
    @Param('key') key: string,
    @Body()
    {
      value,
      type,
      category,
      isPublic,
    }: { value: any; type?: string; category?: string; isPublic?: boolean },
  ) {
    const setting = await this.adminService.updateSystemSetting(key, {
      value,
      type,
      category,
      isPublic,
    });
    await this.auditService.log({
      action: 'admin.settings.update',
      entityType: 'system_setting',
      entityId: key,
      metadata: { key },
      context: this.auditContext(req),
    });
    return {
      message: 'Setting updated',
      data: setting,
    };
  }

  @Delete('settings/:key')
  @Permissions('settings.update')
  @ApiOperation({ summary: 'Delete system setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted' })
  async deleteSystemSetting(@Req() req: any, @Param('key') key: string) {
    await this.adminService.deleteSystemSetting(key);
    await this.auditService.log({
      action: 'admin.settings.delete',
      entityType: 'system_setting',
      entityId: key,
      metadata: { key },
      context: this.auditContext(req),
    });
    return {
      message: 'Setting deleted',
    };
  }

  private auditContext(req: any) {
    return {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent') || req.headers?.['user-agent'],
    };
  }
}
