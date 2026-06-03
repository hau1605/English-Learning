import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { SpeakingService } from "./speaking.service";
import { PrismaService } from "@/prisma/prisma.service";
import { QueueService } from "@/queues/queue.service";
import { EventService } from "@/modules/events/services/event.service";
import { PointsService } from "@/modules/points/points.service";

describe("SpeakingService", () => {
  let service: SpeakingService;
  let prismaService: any;
  let queueService: jest.Mocked<QueueService>;
  let eventService: jest.Mocked<EventService>;
  let pointsService: any;

  const mockUserId = "user-123";
  const mockExerciseId = "exercise-123";
  const mockAttemptId = "attempt-123";

  const mockExercise = {
    id: mockExerciseId,
    lessonId: "lesson-123",
    title: "Test Exercise",
    textContent: "Hello, how are you?",
    expectedPronunciation: "Hello, how are you?",
    difficulty: 1,
    audioUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttempt = {
    id: mockAttemptId,
    userId: mockUserId,
    speakingExerciseId: mockExerciseId,
    audioUrl: "https://example.com/audio.mp3",
    transcript: null,
    pronunciationScore: null,
    fluencyScore: null,
    accuracyScore: null,
    overallScore: null,
    feedback: null,
    processingStatus: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    exercise: mockExercise,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      speakingExercise: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userSpeakingAttempt: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      userDailyStat: {
        upsert: jest.fn(),
      },
    };

    const mockQueueService = {
      addSpeakingAnalysisJob: jest.fn(),
    };

    const mockEventService = {
      emitSpeakingCompleted: jest.fn(),
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
        SpeakingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: EventService, useValue: mockEventService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<SpeakingService>(SpeakingService);
    prismaService = module.get(PrismaService);
    queueService = module.get(QueueService);
    eventService = module.get(EventService);
    pointsService = module.get(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getExercises", () => {
    it("should return exercises without filters when no params provided", async () => {
      prismaService.speakingExercise.findMany.mockResolvedValue([mockExercise]);

      const result = await service.getExercises({});

      expect(prismaService.speakingExercise.findMany).toHaveBeenCalledWith({
        where: {},
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { attempts: true },
          },
        },
      });
      expect(result).toEqual([mockExercise]);
    });

    it("should filter by lessonId when provided", async () => {
      prismaService.speakingExercise.findMany.mockResolvedValue([mockExercise]);

      await service.getExercises({ lessonId: "lesson-123" });

      expect(prismaService.speakingExercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lessonId: "lesson-123" },
        }),
      );
    });

    it("should filter by difficulty when provided", async () => {
      prismaService.speakingExercise.findMany.mockResolvedValue([mockExercise]);

      await service.getExercises({ difficulty: 2 });

      expect(prismaService.speakingExercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { difficulty: 2 },
        }),
      );
    });

    it("should respect custom limit", async () => {
      prismaService.speakingExercise.findMany.mockResolvedValue([]);

      await service.getExercises({ limit: 5 });

      expect(prismaService.speakingExercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe("getExerciseById", () => {
    it("should return exercise when found", async () => {
      prismaService.speakingExercise.findUnique.mockResolvedValue(mockExercise);

      const result = await service.getExerciseById(mockExerciseId);

      expect(prismaService.speakingExercise.findUnique).toHaveBeenCalledWith({
        where: { id: mockExerciseId },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result).toEqual(mockExercise);
    });

    it("should throw NotFoundException when exercise not found", async () => {
      prismaService.speakingExercise.findUnique.mockResolvedValue(null);

      await expect(service.getExerciseById(mockExerciseId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createExercise", () => {
    it("should create exercise with all provided fields", async () => {
      const exerciseData = {
        lessonId: "lesson-123",
        title: "New Exercise",
        textContent: "Hello, world!",
        expectedPronunciation: "Hello, world!",
        difficulty: 2,
        audioUrl: "https://example.com/audio.mp3",
      };
      prismaService.speakingExercise.create.mockResolvedValue({
        ...exerciseData,
        id: "new-exercise-id",
      });

      const result = await service.createExercise(exerciseData);

      expect(prismaService.speakingExercise.create).toHaveBeenCalledWith({
        data: {
          lessonId: exerciseData.lessonId,
          title: exerciseData.title,
          textContent: exerciseData.textContent,
          expectedPronunciation: exerciseData.expectedPronunciation,
          difficulty: exerciseData.difficulty,
          audioUrl: exerciseData.audioUrl,
        },
      });
      expect(result).toHaveProperty("id");
    });

    it("should set default difficulty when not provided", async () => {
      const exerciseData = {
        title: "New Exercise",
        textContent: "Hello, world!",
      };
      prismaService.speakingExercise.create.mockResolvedValue({
        ...exerciseData,
        id: "new-exercise-id",
        difficulty: 1,
      });

      const result = await service.createExercise(exerciseData);

      expect(prismaService.speakingExercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          difficulty: 1,
        }),
      });
    });
  });

  describe("submitAttempt", () => {
    it("should throw NotFoundException when exercise not found", async () => {
      prismaService.speakingExercise.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAttempt(
          mockUserId,
          mockExerciseId,
          "https://example.com/audio.mp3",
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should create attempt and queue for processing", async () => {
      prismaService.speakingExercise.findUnique.mockResolvedValue(mockExercise);
      prismaService.userSpeakingAttempt.create.mockResolvedValue(mockAttempt);
      queueService.addSpeakingAnalysisJob.mockResolvedValue(undefined);

      const result = await service.submitAttempt(
        mockUserId,
        mockExerciseId,
        "https://example.com/audio.mp3",
      );

      expect(prismaService.userSpeakingAttempt.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          speakingExerciseId: mockExerciseId,
          audioUrl: "https://example.com/audio.mp3",
          processingStatus: "PENDING",
        },
      });
      expect(queueService.addSpeakingAnalysisJob).toHaveBeenCalledWith(
        mockUserId,
        mockAttemptId,
        "https://example.com/audio.mp3",
      );
      expect(result.attemptId).toBe(mockAttemptId);
      expect(result.status).toBe("PENDING");
    });
  });

  describe("getAttemptResult", () => {
    it("should return attempt with exercise info when found", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );

      const result = await service.getAttemptResult(mockAttemptId);

      expect(prismaService.userSpeakingAttempt.findUnique).toHaveBeenCalledWith(
        {
          where: { id: mockAttemptId },
          include: {
            exercise: {
              select: {
                id: true,
                title: true,
                textContent: true,
              },
            },
          },
        },
      );
      expect(result).toEqual(mockAttempt);
    });

    it("should throw NotFoundException when attempt not found", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(null);

      await expect(service.getAttemptResult(mockAttemptId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("processAttempt", () => {
    beforeEach(() => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
    });

    it("should throw NotFoundException when attempt not found", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(null);

      await expect(service.processAttempt(mockAttemptId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should update status to PROCESSING initially", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
      prismaService.userSpeakingAttempt.update.mockResolvedValue({
        ...mockAttempt,
        processingStatus: "PROCESSING",
      });
      prismaService.userSpeakingAttempt.update.mockResolvedValue({
        ...mockAttempt,
        processingStatus: "COMPLETED",
        overallScore: 82,
      });
      prismaService.user.update.mockResolvedValue({});

      await service.processAttempt(mockAttemptId);

      expect(prismaService.userSpeakingAttempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: { processingStatus: "PROCESSING" },
      });
    });

    it("should complete attempt without external scoring", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
      prismaService.userSpeakingAttempt.update.mockResolvedValue({
        ...mockAttempt,
        processingStatus: "COMPLETED",
      });
      prismaService.user.update.mockResolvedValue({});

      const result = await service.processAttempt(mockAttemptId);

      expect(result.feedback).toContain("Automated pronunciation scoring is disabled");
      expect(result.transcript).toBe("");
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("suggestions");
    });

    it("should award XP when score is positive", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
      prismaService.userSpeakingAttempt.update.mockResolvedValue({
        ...mockAttempt,
        processingStatus: "COMPLETED",
      });

      await service.processAttempt(mockAttemptId);

      // Check that PointsService.awardXp was called
      expect(pointsService.awardXp).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Number),
        "speaking",
      );
    });

    it("should emit speaking completed event", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
      prismaService.userSpeakingAttempt.update.mockResolvedValue({
        ...mockAttempt,
        processingStatus: "COMPLETED",
      });
      prismaService.user.update.mockResolvedValue({});

      await service.processAttempt(mockAttemptId);

      expect(eventService.emitSpeakingCompleted).toHaveBeenCalledWith(
        mockUserId,
        mockAttemptId,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("should mark as FAILED when update fails", async () => {
      prismaService.userSpeakingAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );
      prismaService.userSpeakingAttempt.update
        .mockResolvedValueOnce({ ...mockAttempt, processingStatus: "PROCESSING" })
        .mockRejectedValueOnce(new Error("Processing Error"));

      await expect(service.processAttempt(mockAttemptId)).rejects.toThrow(
        "Processing Error",
      );

      expect(prismaService.userSpeakingAttempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: { processingStatus: "FAILED" },
      });
    });
  });

  describe("getAttempts", () => {
    it("should return paginated attempts", async () => {
      const mockAttempts = [mockAttempt];
      prismaService.userSpeakingAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );
      prismaService.userSpeakingAttempt.count.mockResolvedValue(1);

      const result = await service.getAttempts(mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(mockAttempts);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it("should use default pagination values", async () => {
      prismaService.userSpeakingAttempt.findMany.mockResolvedValue([]);
      prismaService.userSpeakingAttempt.count.mockResolvedValue(0);

      await service.getAttempts(mockUserId, {});

      expect(prismaService.userSpeakingAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe("getAttemptStats", () => {
    it("should return aggregated stats", async () => {
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _count: 5,
        _avg: {
          pronunciationScore: 85.5,
          fluencyScore: 80.2,
          accuracyScore: 82.0,
          overallScore: 82.5,
        },
      });

      const result = await service.getAttemptStats(mockUserId);

      expect(result.totalAttempts).toBe(5);
      expect(result.averagePronunciation).toBe(86);
      expect(result.averageFluency).toBe(80);
      expect(result.averageAccuracy).toBe(82);
      expect(result.averageOverall).toBe(83);
    });

    it("should return zeros when no attempts exist", async () => {
      prismaService.userSpeakingAttempt.aggregate.mockResolvedValue({
        _count: 0,
        _avg: {
          pronunciationScore: null,
          fluencyScore: null,
          accuracyScore: null,
          overallScore: null,
        },
      });

      const result = await service.getAttemptStats(mockUserId);

      expect(result.totalAttempts).toBe(0);
      expect(result.averagePronunciation).toBe(0);
      expect(result.averageFluency).toBe(0);
      expect(result.averageAccuracy).toBe(0);
      expect(result.averageOverall).toBe(0);
    });
  });
});
