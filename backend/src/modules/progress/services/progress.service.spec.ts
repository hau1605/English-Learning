import { Test, TestingModule } from "@nestjs/testing";
import { ProgressService } from "./progress.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/common/redis/redis.service";
import { EventService } from "@/modules/events/services/event.service";
import { NotificationsService } from "@/modules/notifications/services/notifications.service";
import { EmailService } from "@/modules/email/services/email.service";
import { PointsService } from "@/modules/points/points.service";
import { ACHIEVEMENTS } from "../constants/achievements";

describe("ProgressService", () => {
  let service: ProgressService;
  let prismaService: any;
  let redisService: jest.Mocked<RedisService>;
  let eventService: jest.Mocked<EventService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let emailService: jest.Mocked<EmailService>;
  let pointsService: any;

  const mockUserId = "user-123";

  const mockUser = {
    id: mockUserId,
    xp: 1500,
    level: 5,
    streakDays: 7,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userFlashcardReview: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalReviews: 0 } }),
      },
      userQuizAttempt: {
        aggregate: jest.fn().mockResolvedValue({ _count: true }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      userSpeakingAttempt: {
        aggregate: jest.fn().mockResolvedValue({ _count: true }),
      },
      userDailyStat: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            learnedWords: 0,
            speakingMinutes: 0,
            studyMinutes: 0,
            xpEarned: 0,
            flashcardsReviewed: 0,
            quizzesCompleted: 0,
          },
        }),
      },
      userNotification: {
        findFirst: jest.fn(),
      },
    };

    const mockRedisService = {
      getJson: jest.fn(),
      setJson: jest.fn(),
    };

    const mockEventService = {
      emitXpUpdated: jest.fn(),
      emitStreakUpdated: jest.fn(),
      emitFlashcardReviewed: jest.fn(),
      emitQuizCompleted: jest.fn(),
      emitSpeakingCompleted: jest.fn(),
    };

    const mockNotificationsService = {
      create: jest.fn(),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendWeeklyReport: jest.fn(),
    };

    const mockPointsService = {
      awardXp: jest.fn().mockResolvedValue({ id: "1", xp: 10 }),
      awardXpWithinTransaction: jest
        .fn()
        .mockResolvedValue({ id: "1", xp: 10 }),
      finalizeXpAward: jest.fn().mockResolvedValue({ id: "1", xp: 10 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EventService, useValue: mockEventService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
    eventService = module.get(EventService);
    notificationsService = module.get(NotificationsService);
    emailService = module.get(EmailService);
    pointsService = module.get(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserProgress", () => {
    it("should return cached progress if available", async () => {
      const cachedProgress = {
        userId: mockUserId,
        totalXp: 1500,
        level: 5,
        xpToNextLevel: 500,
        streakDays: 7,
        longestStreak: 7,
        totalWordsLearned: 100,
        totalFlashcardsReviewed: 200,
        totalQuizzesCompleted: 50,
        totalSpeakingMinutes: 0,
        averageAccuracy: 0,
      };
      redisService.getJson.mockResolvedValue(cachedProgress);

      const result = await service.getUserProgress(mockUserId);

      expect(redisService.getJson).toHaveBeenCalledWith(
        `progress:${mockUserId}`,
      );
      expect(result).toEqual(cachedProgress);
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache is empty", async () => {
      redisService.getJson.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userFlashcardReview.aggregate.mockResolvedValue({
        _sum: { totalReviews: 100 },
      } as any);
      prismaService.userQuizAttempt.aggregate.mockResolvedValue({
        _count: 50,
      } as any);
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _sum: { fluencyScore: 500 },
      } as any);

      const result = await service.getUserProgress(mockUserId);

      expect(prismaService.user.findUnique).toHaveBeenCalled();
      expect(result.userId).toBe(mockUserId);
      expect(result.totalXp).toBe(1500);
      expect(result.level).toBe(5);
      expect(result.streakDays).toBe(7);
      expect(redisService.setJson).toHaveBeenCalled();
    });

    it("should throw error when user not found", async () => {
      redisService.getJson.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProgress(mockUserId)).rejects.toThrow(
        "User not found",
      );
    });

    it("should calculate xpToNextLevel correctly", async () => {
      redisService.getJson.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userFlashcardReview.aggregate.mockResolvedValue({
        _sum: { totalReviews: 0 },
      } as any);
      prismaService.userQuizAttempt.aggregate.mockResolvedValue({
        _count: 0,
      } as any);
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _sum: { fluencyScore: null },
      } as any);

      const result = await service.getUserProgress(mockUserId);

      // User has 1500 XP at level 5. Level 6 requires 743 XP total.
      // Since 1500 > 743, xpToNextLevel should be 0 (already passed level 6)
      expect(result.xpToNextLevel).toBe(0);
      expect(result.level).toBe(5);
    });
  });

  describe("getDailyProgress", () => {
    it("should return stats for specified date", async () => {
      const mockDate = new Date("2024-01-15");
      const mockStats = {
        id: "stat-1",
        userId: mockUserId,
        date: mockDate,
        xpEarned: 100,
        wordsLearned: 5,
        flashcardsReviewed: 10,
        quizzesCompleted: 2,
        studyMinutes: 30,
        streakContinued: true,
      };
      prismaService.userDailyStat.findFirst.mockResolvedValue(mockStats as any);

      const result = await service.getDailyProgress(mockUserId, mockDate);

      expect(result).toEqual(mockStats);
    });

    it("should return default values when no stats found", async () => {
      const mockDate = new Date("2024-01-15");
      prismaService.userDailyStat.findFirst.mockResolvedValue(null);

      const result = await service.getDailyProgress(mockUserId, mockDate);

      expect(result.xpEarned).toBe(0);
      expect(result.wordsLearned).toBe(0);
      expect(result.flashcardsReviewed).toBe(0);
      expect(result.streakContinued).toBe(false);
    });
  });

  describe("getWeeklyProgress", () => {
    it("should return aggregated weekly stats", async () => {
      const mockStats = [
        {
          xpEarned: 100,
          studyMinutes: 30,
          flashcardsReviewed: 10,
          quizzesCompleted: 2,
        },
        {
          xpEarned: 150,
          studyMinutes: 45,
          flashcardsReviewed: 15,
          quizzesCompleted: 3,
        },
        {
          xpEarned: 200,
          studyMinutes: 60,
          flashcardsReviewed: 20,
          quizzesCompleted: 4,
        },
      ];
      prismaService.userDailyStat.findMany.mockResolvedValue(mockStats as any);

      const result = await service.getWeeklyProgress(mockUserId);

      expect(result.totalXp).toBe(450);
      expect(result.totalStudyMinutes).toBe(135);
      expect(result.totalFlashcardsReviewed).toBe(45);
      expect(result.totalQuizzesCompleted).toBe(9);
      expect(result.activeDays).toBe(3);
      expect(result).toHaveProperty("week");
    });

    it("should return zero values when no stats found", async () => {
      prismaService.userDailyStat.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyProgress(mockUserId);

      expect(result.totalXp).toBe(0);
      expect(result.totalStudyMinutes).toBe(0);
      expect(result.activeDays).toBe(0);
    });
  });

  describe("checkAndAwardAchievements", () => {
    beforeEach(() => {
      redisService.getJson.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userFlashcardReview.aggregate.mockResolvedValue({
        _sum: { totalReviews: 100 },
      } as any);
      prismaService.userQuizAttempt.aggregate.mockResolvedValue({
        _count: 50,
      } as any);
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _sum: { fluencyScore: 500 },
      } as any);
    });

    it("should not award already unlocked achievements", async () => {
      prismaService.userNotification.findFirst.mockResolvedValue({
        id: "notif-1",
      } as any);

      const result = await service.checkAndAwardAchievements(mockUserId);

      expect(result).toHaveLength(0);
    });

    it("should award new achievements when conditions are met", async () => {
      prismaService.userNotification.findFirst.mockResolvedValue(null);
      notificationsService.create.mockResolvedValue({} as any);

      const result = await service.checkAndAwardAchievements(mockUserId);

      expect(result.length).toBeGreaterThan(0);
      expect(notificationsService.create).toHaveBeenCalled();
      expect(eventService.emitXpUpdated).toHaveBeenCalled();
      expect(pointsService.awardXp).toHaveBeenCalled();
    });
  });

  describe("getUserAchievements", () => {
    beforeEach(() => {
      redisService.getJson.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userFlashcardReview.aggregate.mockResolvedValue({
        _sum: { totalReviews: 100 },
      } as any);
      prismaService.userQuizAttempt.aggregate.mockResolvedValue({
        _count: 50,
      } as any);
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _sum: { fluencyScore: 500 },
      } as any);
    });

    it("should return empty array when user not found", async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserAchievements(mockUserId);

      expect(result).toHaveLength(0);
    });

    it("should return all achievements with progress", async () => {
      const result = await service.getUserAchievements(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(ACHIEVEMENTS.length);

      const streakAchievement = result.find((a: any) => a.id === "streak_7");
      expect(streakAchievement).toBeDefined();
      expect(streakAchievement.isUnlocked).toBe(true);
      expect(streakAchievement.progress).toBe(100);

      const flashcardAchievement = result.find(
        (a: any) => a.id === "flashcards_10",
      );
      expect(flashcardAchievement).toBeDefined();
      expect(flashcardAchievement.isUnlocked).toBe(true);
    });

    it("should calculate progress correctly for locked achievements", async () => {
      const result = await service.getUserAchievements(mockUserId);

      const impossibleAchievement = result.find(
        (a: any) => a.id === "streak_100",
      );
      expect(impossibleAchievement.isUnlocked).toBe(false);
      expect(impossibleAchievement.progress).toBe(7);
    });

    it("should include achievement metadata", async () => {
      const result = await service.getUserAchievements(mockUserId);

      const achievement = result[0];
      expect(achievement).toHaveProperty("id");
      expect(achievement).toHaveProperty("name");
      expect(achievement).toHaveProperty("description");
      expect(achievement).toHaveProperty("icon");
      expect(achievement).toHaveProperty("xpReward");
      expect(achievement).toHaveProperty("requirement");
      expect(achievement).toHaveProperty("type");
      expect(achievement).toHaveProperty("isUnlocked");
      expect(achievement).toHaveProperty("progress");
    });
  });
});
