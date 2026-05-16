import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    // Use transaction to avoid orphaned records
    const result = await this.prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: { type: data.type, title: data.title, content: data.message },
      });

      await tx.userNotification.create({
        data: { userId: data.userId, notificationId: notification.id },
      });

      return notification;
    });

    // Emit event for real-time notification
    if (this.eventEmitter) {
      this.eventEmitter.emit("notification.created", {
        userId: data.userId,
        notificationId: result.id,
        type: data.type,
        title: data.title,
        message: data.message,
      });
    }

    return result;
  }

  async getUserNotifications(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.userNotification.findMany({
        where,
        include: {
          notification: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.userNotification.count({ where }),
      this.prisma.userNotification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.userNotification.updateMany({
      where: {
        userId,
        id: notificationId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.userNotification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.userNotification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
