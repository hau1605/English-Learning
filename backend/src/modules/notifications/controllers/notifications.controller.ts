import { Controller, Get, Patch, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications(
    @Req() req: Request & { user: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    const result = await this.notificationsService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly,
    });
    return {
      message: 'Notifications retrieved',
      data: result.data,
      unreadCount: result.unreadCount,
      meta: result.meta,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Count retrieved' })
  async getUnreadCount(@Req() req: Request & { user: { id: string } }) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      message: 'Unread count retrieved',
      data: { count },
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(req.user.id, id);
    return {
      message: 'Notification marked as read',
    };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: Request & { user: { id: string } }) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return {
      message: 'All notifications marked as read',
    };
  }
}
