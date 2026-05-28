import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { FlashcardsService } from "./flashcards.service";
import { FlashcardsRepository } from "../repositories/flashcards.repository";
import { UsersService } from "@/modules/users/services/users.service";
import { VocabularyService } from "@/modules/vocabulary/services/vocabulary.service";
import { RedisService } from "@/common/redis/redis.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PointsService } from "@/modules/points/points.service";
import { CACHE_KEYS } from "@/common/constants/cache-keys";
import { FlashcardRating } from "@/common/enums";

describe("FlashcardsService", () => {
  let service: FlashcardsService;
  let flashcardsRepository: jest.Mocked<FlashcardsRepository>;
  let redisService: jest.Mocked<RedisService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUserId = "user-123";
  const mockFlashcardId = "flashcard-123";
  const mockVocabularyId = "vocab-123";

  const mockFlashcard = {
    id: mockFlashcardId,
    vocabularyId: mockVocabularyId,
    frontContent: "Hello",
    backContent: "Xin chào",
    audioUrl: null,
    imageUrl: null,
    hint: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    vocabulary: {
      id: mockVocabularyId,
      topicId: "topic-123",
      topic: { name: "Greetings", id: "topic-123" },
      word: "Hello",
      pronunciation: "həˈloʊ",
      meaning: "Xin chào",
      example: "Hello, how are you?",
      exampleTranslation: "Xin chào, bạn khỏe không?",
      audioUrl: null,
      imageUrl: null,
      difficulty: 1,
      partOfSpeech: "exclamation",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockReview = {
    id: "review-123",
    userId: mockUserId,
    flashcardId: mockFlashcardId,
    vocabularyId: mockVocabularyId,
    nextReviewAt: new Date(),
    lastReviewedAt: null,
    repetitionCount: 0,
    easeFactor: 2.5,
    intervalDays: 1,
    correctStreak: 0,
    wrongCount: 0,
    totalReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    flashcard: mockFlashcard,
    vocabulary: mockFlashcard.vocabulary,
  };

  beforeEach(async () => {
    const mockFlashcardsRepository = {
      getDueCards: jest.fn(),
      getStats: jest.fn(),
      getAllForUser: jest.fn(),
      findById: jest.fn(),
      findAllAdmin: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createBulk: jest.fn(),
      generateFromVocabulary: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockRedisService = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const mockPrismaService = {
      $transaction: jest.fn(),
      userFlashcardReview: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      } as any,
      user: {
        update: jest.fn(),
      } as any,
      userDailyStat: {
        upsert: jest.fn(),
      } as any,
      analyticsEvent: {
        create: jest.fn(),
      } as any,
      vocabulary: {
        findMany: jest.fn().mockResolvedValue([{ id: "v1" }, { id: "v2" }]),
      } as any,
    };

    (
      mockPrismaService.userFlashcardReview.deleteMany as jest.Mock
    ).mockResolvedValue({ count: 1 });

    const mockVocabularyService = {
      getVocabularyById: jest.fn().mockResolvedValue({ id: mockVocabularyId }),
      findById: jest.fn(),
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
        FlashcardsService,
        { provide: FlashcardsRepository, useValue: mockFlashcardsRepository },
        { provide: UsersService, useValue: mockUsersService },
        { provide: VocabularyService, useValue: mockVocabularyService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<FlashcardsService>(FlashcardsService);
    flashcardsRepository = module.get(FlashcardsRepository);
    redisService = module.get(RedisService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDueCards", () => {
    it("should return cached due cards if available", async () => {
      const cachedCards = [mockReview];
      redisService.getJson.mockResolvedValue(cachedCards);

      const result = await service.getDueCards(mockUserId);

      expect(redisService.getJson).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.DUE(mockUserId),
      );
      expect(result).toEqual(cachedCards);
      expect(flashcardsRepository.getDueCards).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache is empty", async () => {
      redisService.getJson.mockResolvedValue(null);
      flashcardsRepository.getDueCards.mockResolvedValue([mockReview]);

      const result = await service.getDueCards(mockUserId);

      expect(flashcardsRepository.getDueCards).toHaveBeenCalledWith(
        mockUserId,
        20,
      );
      expect(redisService.setJson).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.DUE(mockUserId),
        [mockReview],
        60,
      );
      expect(result).toEqual([mockReview]);
    });

    it("should respect custom limit parameter", async () => {
      redisService.getJson.mockResolvedValue(null);
      flashcardsRepository.getDueCards.mockResolvedValue([]);

      await service.getDueCards(mockUserId, 10);

      expect(flashcardsRepository.getDueCards).toHaveBeenCalledWith(
        mockUserId,
        10,
      );
    });
  });

  describe("reviewFlashcard", () => {
    const mockReviewDto = {
      flashcardId: mockFlashcardId,
      rating: FlashcardRating.GOOD,
    };

    beforeEach(() => {
      flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
    });

    it("should throw NotFoundException when flashcard does not exist", async () => {
      flashcardsRepository.findById.mockResolvedValue(null);

      await expect(
        service.reviewFlashcard(mockUserId, mockReviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should create new review when no existing review found", async () => {
      flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          userFlashcardReview: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              ...mockReview,
              id: "new-review-id",
            }),
            update: jest.fn().mockResolvedValue({
              ...mockReview,
              repetitionCount: 1,
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue({}),
          },
          userDailyStat: {
            upsert: jest.fn().mockResolvedValue({}),
          },
          analyticsEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        } as any);
      });

      const result = await service.reviewFlashcard(mockUserId, mockReviewDto);

      expect(result).toHaveProperty("flashcardId");
      expect(result).toHaveProperty("isCorrect");
      expect(result).toHaveProperty("xpEarned");
      expect(result).toHaveProperty("nextReviewAt");
    });

    it("should return correct XP when rating is GOOD or EASY", async () => {
      flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          userFlashcardReview: {
            findUnique: jest.fn().mockResolvedValue(mockReview),
            update: jest.fn().mockResolvedValue({
              ...mockReview,
              repetitionCount: 1,
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue({}),
          },
          userDailyStat: {
            upsert: jest.fn().mockResolvedValue({}),
          },
          analyticsEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        } as any);
      });

      const result = await service.reviewFlashcard(mockUserId, {
        flashcardId: mockFlashcardId,
        rating: FlashcardRating.GOOD,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.xpEarned).toBeGreaterThan(0);
    });

    it("should return zero XP when rating is AGAIN or HARD", async () => {
      flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          userFlashcardReview: {
            findUnique: jest.fn().mockResolvedValue(mockReview),
            update: jest.fn().mockResolvedValue({
              ...mockReview,
              wrongCount: 1,
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue({}),
          },
          userDailyStat: {
            upsert: jest.fn().mockResolvedValue({}),
          },
          analyticsEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        } as any);
      });

      const result = await service.reviewFlashcard(mockUserId, {
        flashcardId: mockFlashcardId,
        rating: FlashcardRating.AGAIN,
      });

      expect(result.isCorrect).toBe(false);
      expect(result.xpEarned).toBe(0);
    });

    it("should invalidate cache after review", async () => {
      flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          userFlashcardReview: {
            findUnique: jest.fn().mockResolvedValue(mockReview),
            update: jest.fn().mockResolvedValue({}),
          },
          user: {
            update: jest.fn().mockResolvedValue({}),
          },
          userDailyStat: {
            upsert: jest.fn().mockResolvedValue({}),
          },
          analyticsEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        } as any);
      });

      await service.reviewFlashcard(mockUserId, mockReviewDto);

      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.DUE(mockUserId),
      );
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.STATS(mockUserId),
      );
    });
  });

  describe("getStats", () => {
    const mockStats = {
      totalReviews: 100,
      totalCards: 50,
      dueCards: 10,
      masteredCards: 30,
      reviewsByDay: [],
    };

    it("should return cached stats if available", async () => {
      redisService.getJson.mockResolvedValue(mockStats);

      const result = await service.getStats(mockUserId);

      expect(redisService.getJson).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.STATS(mockUserId),
      );
      expect(result).toEqual(mockStats);
      expect(flashcardsRepository.getStats).not.toHaveBeenCalled();
    });

    it("should fetch stats from database when cache is empty", async () => {
      redisService.getJson.mockResolvedValue(null);
      flashcardsRepository.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats(mockUserId);

      expect(flashcardsRepository.getStats).toHaveBeenCalledWith(mockUserId);
      expect(redisService.setJson).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.STATS(mockUserId),
        mockStats,
        300,
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe("getAllFlashcards", () => {
    it("should call repository with userId", async () => {
      flashcardsRepository.getAllForUser.mockResolvedValue([mockReview]);

      const result = await service.getAllFlashcards(mockUserId);

      expect(flashcardsRepository.getAllForUser).toHaveBeenCalledWith(
        mockUserId,
        undefined,
      );
      expect(result).toEqual([mockReview]);
    });

    it("should pass topicId to repository when provided", async () => {
      const topicId = "topic-123";
      flashcardsRepository.getAllForUser.mockResolvedValue([]);

      await service.getAllFlashcards(mockUserId, topicId);

      expect(flashcardsRepository.getAllForUser).toHaveBeenCalledWith(
        mockUserId,
        topicId,
      );
    });
  });

  describe("createFlashcard", () => {
    const createDto = {
      vocabularyId: mockVocabularyId,
      frontContent: "Test front",
      backContent: "Test back",
    };

    it("should call repository create method", async () => {
      flashcardsRepository.create.mockResolvedValue(mockFlashcard);

      const result = await service.createFlashcard(createDto);

      expect(flashcardsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockFlashcard);
    });
  });

  describe("resetProgress", () => {
    it("should delete reviews for specific flashcard when flashcardId provided", async () => {
      (
        prismaService.userFlashcardReview.deleteMany as jest.Mock
      ).mockResolvedValue({ count: 1 });

      await service.resetProgress(mockUserId, mockFlashcardId);

      expect(prismaService.userFlashcardReview.deleteMany).toHaveBeenCalledWith(
        {
          where: { userId: mockUserId, flashcardId: mockFlashcardId },
        },
      );
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.DUE(mockUserId),
      );
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.FLASHCARD.STATS(mockUserId),
      );
    });

    it("should delete all reviews when no flashcardId provided", async () => {
      (
        prismaService.userFlashcardReview.deleteMany as jest.Mock
      ).mockResolvedValue({ count: 10 });

      await service.resetProgress(mockUserId);

      expect(prismaService.userFlashcardReview.deleteMany).toHaveBeenCalledWith(
        {
          where: { userId: mockUserId },
        },
      );
    });
  });

  describe("admin methods", () => {
    describe("getFlashcardsAdmin", () => {
      it("should call repository findAllAdmin with params", async () => {
        const params = { page: 1, limit: 20, search: "test" };
        flashcardsRepository.findAllAdmin.mockResolvedValue({
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        });

        const result = await service.getFlashcardsAdmin(params);

        expect(flashcardsRepository.findAllAdmin).toHaveBeenCalledWith(params);
        expect(result).toHaveProperty("data");
        expect(result).toHaveProperty("meta");
      });
    });

    describe("getFlashcardById", () => {
      it("should return flashcard when found", async () => {
        flashcardsRepository.findById.mockResolvedValue(mockFlashcard);

        const result = await service.getFlashcardById(mockFlashcardId);

        expect(result).toEqual(mockFlashcard);
      });

      it("should throw NotFoundException when not found", async () => {
        flashcardsRepository.findById.mockResolvedValue(null);

        await expect(service.getFlashcardById(mockFlashcardId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe("updateFlashcard", () => {
      it("should throw NotFoundException when flashcard not found", async () => {
        flashcardsRepository.findById.mockResolvedValue(null);

        await expect(
          service.updateFlashcard(mockFlashcardId, {
            frontContent: "new content",
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it("should call repository update when flashcard exists", async () => {
        flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
        flashcardsRepository.update.mockResolvedValue({
          ...mockFlashcard,
          frontContent: "new content",
        });

        const result = await service.updateFlashcard(mockFlashcardId, {
          frontContent: "new content",
        });

        expect(flashcardsRepository.update).toHaveBeenCalledWith(
          mockFlashcardId,
          {
            frontContent: "new content",
          },
        );
        expect(result.frontContent).toBe("new content");
      });
    });

    describe("deleteFlashcard", () => {
      it("should throw NotFoundException when flashcard not found", async () => {
        flashcardsRepository.findById.mockResolvedValue(null);

        await expect(service.deleteFlashcard(mockFlashcardId)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("should call repository delete when flashcard exists", async () => {
        flashcardsRepository.findById.mockResolvedValue(mockFlashcard);
        flashcardsRepository.delete.mockResolvedValue(mockFlashcard);

        const result = await service.deleteFlashcard(mockFlashcardId);

        expect(flashcardsRepository.delete).toHaveBeenCalledWith(
          mockFlashcardId,
        );
        expect(result).toEqual(mockFlashcard);
      });
    });

    describe("createBulkFlashcards", () => {
      it("should call repository createBulk method", async () => {
        const bulkDto = [
          { vocabularyId: "v1", frontContent: "f1", backContent: "b1" },
          { vocabularyId: "v2", frontContent: "f2", backContent: "b2" },
        ];
        flashcardsRepository.createBulk.mockResolvedValue({ count: 2 });

        const result = await service.createBulkFlashcards(bulkDto);

        expect(flashcardsRepository.createBulk).toHaveBeenCalledWith(bulkDto);
        expect(result.count).toBe(2);
      });
    });

    describe("generateFlashcardFromVocabulary", () => {
      it("should call repository generateFromVocabulary method", async () => {
        flashcardsRepository.generateFromVocabulary.mockResolvedValue(
          mockFlashcard,
        );

        const result =
          await service.generateFlashcardFromVocabulary(mockVocabularyId);

        expect(
          flashcardsRepository.generateFromVocabulary,
        ).toHaveBeenCalledWith(mockVocabularyId);
        expect(result).toEqual(mockFlashcard);
      });
    });
  });
});
