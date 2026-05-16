import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "@/prisma/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotificationType } from "@prisma/client";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockNotification = {
    id: "notif-1",
    type: NotificationType.SYSTEM,
    title: "Test Notification",
    content: "Test message",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserNotification = {
    id: "user-notif-1",
    userId: "user-1",
    notificationId: "notif-1",
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      $transaction: jest.fn(async (callback) => {
        const mockTx = {
          notification: {
            create: jest.fn().mockResolvedValue(mockNotification),
          },
          userNotification: {
            create: jest.fn().mockResolvedValue(mockUserNotification),
            findMany: jest
              .fn()
              .mockResolvedValue([
                { ...mockUserNotification, notification: mockNotification },
              ]),
            count: jest.fn().mockResolvedValue(1),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockUserNotification, isRead: true }),
          },
        };
        return callback(mockTx);
      }),
      userNotification: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { ...mockUserNotification, notification: mockNotification },
          ]),
        count: jest.fn().mockResolvedValue(1),
        update: jest
          .fn()
          .mockResolvedValue({ ...mockUserNotification, isRead: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create notification and user notification within a transaction", async () => {
      const result = await service.create({
        userId: "user-1",
        title: "Test Notification",
        message: "Test message",
        type: NotificationType.SYSTEM,
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe("notif-1");
      expect(result.title).toBe("Test Notification");
    });

    it("should emit notification.created event", async () => {
      await service.create({
        userId: "user-1",
        title: "Test Notification",
        message: "Test message",
        type: NotificationType.SYSTEM,
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "notification.created",
        expect.objectContaining({
          userId: "user-1",
          title: "Test Notification",
        }),
      );
    });

    it("should ensure transaction is used for atomicity", async () => {
      await service.create({
        userId: "user-1",
        title: "Test Notification",
        message: "Test message",
        type: NotificationType.ACHIEVEMENT,
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it("should handle different notification types", async () => {
      const types: NotificationType[] = [
        NotificationType.SYSTEM,
        NotificationType.ACHIEVEMENT,
        NotificationType.REMINDER,
      ];

      for (const type of types) {
        await service.create({
          userId: "user-1",
          title: "Test",
          message: "Message",
          type,
        });
      }

      expect(prismaService.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe("getUserNotifications", () => {
    it("should retrieve user notifications with pagination", async () => {
      const result = await service.getUserNotifications("user-1", {
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter unread notifications", async () => {
      await service.getUserNotifications("user-1", {
        page: 1,
        limit: 10,
        unreadOnly: true,
      });

      expect(prismaService.userNotification.findMany).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const result = await service.markAsRead("user-1", "user-notif-1");

      expect(result).toBeDefined();
      expect(result.count).toBe(1);
    });
  });
});
