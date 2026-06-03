import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "../repositories/quiz.repository";
import { RedisService } from "@/common/redis/redis.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PointsService } from "@/modules/points/points.service";
import { CACHE_KEYS, CACHE_TTL } from "@/common/constants/cache-keys";
import { QuizType, QuestionType } from "@prisma/client";

describe("QuizService", () => {
  let service: QuizService;
  let quizRepository: jest.Mocked<QuizRepository>;
  let redisService: jest.Mocked<RedisService>;
  let prismaService: any;
  let pointsService: any;

  const mockUserId = "user-123";
  const mockQuizId = "quiz-123";
  const mockQuestionId = "question-123";
  const mockAnswerId = "answer-123";

  const mockQuiz = {
    id: mockQuizId,
    lessonId: "lesson-123",
    lesson: { id: "lesson-123", title: "Test Lesson" },
    title: "Test Quiz",
    description: "Test Description",
    type: QuizType.MULTIPLE_CHOICE,
    durationSeconds: 600,
    passingScore: 70,
    maxAttempts: 3,
    publishedAt: new Date(),
    isGenerated: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { questions: 1 },
    questions: [
      {
        id: mockQuestionId,
        quizId: mockQuizId,
        type: QuestionType.SINGLE_CHOICE,
        question: "What is the capital of France?",
        explanation: "Paris is the capital of France",
        audioUrl: null,
        imageUrl: null,
        orderIndex: 0,
        points: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: [
          {
            id: mockAnswerId,
            questionId: mockQuestionId,
            answer: "Paris",
            isCorrect: true,
            orderIndex: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "answer-2",
            questionId: mockQuestionId,
            answer: "London",
            isCorrect: false,
            orderIndex: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const mockQuizRepository = {
      findById: jest.fn(),
      findByIdWithAnswers: jest.fn(),
      findAll: jest.fn(),
      findAllAdmin: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
      addAnswer: jest.fn(),
      deleteAnswer: jest.fn(),
      getHistory: jest.fn(),
      getAttempt: jest.fn(),
    };

    const mockRedisService = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      del: jest.fn(),
    };

    const mockPrismaService = {
      userQuizAttempt: {
        create: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
      },
      userDailyStat: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
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
        QuizService,
        { provide: QuizRepository, useValue: mockQuizRepository },
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    quizRepository = module.get(QuizRepository);
    redisService = module.get(RedisService);
    prismaService = module.get(PrismaService);
    pointsService = module.get(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuizById", () => {
    it("should return cached quiz if available", async () => {
      redisService.getJson.mockResolvedValue(mockQuiz);

      const result = await service.getQuizById(mockQuizId);

      expect(redisService.getJson).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
      );
      expect(result).toEqual(mockQuiz);
      expect(quizRepository.findById).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache is empty", async () => {
      redisService.getJson.mockResolvedValue(null);
      quizRepository.findById.mockResolvedValue(mockQuiz);

      const result = await service.getQuizById(mockQuizId);

      expect(quizRepository.findById).toHaveBeenCalledWith(mockQuizId);
      expect(redisService.setJson).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
        mockQuiz,
        CACHE_TTL.MEDIUM,
      );
      expect(result).toEqual(mockQuiz);
    });

    it("should throw NotFoundException when quiz not found", async () => {
      redisService.getJson.mockResolvedValue(null);
      quizRepository.findById.mockResolvedValue(null);

      await expect(service.getQuizById(mockQuizId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getQuizzes", () => {
    it("should call repository findAll with params", async () => {
      const params = {
        lessonId: "lesson-123",
        type: QuizType.MULTIPLE_CHOICE,
        limit: 10,
      };
      quizRepository.findAll.mockResolvedValue([mockQuiz]);

      const result = await service.getQuizzes(params);

      expect(quizRepository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockQuiz]);
    });
  });

  describe("getQuizzesAdmin", () => {
    it("should call repository findAllAdmin with params", async () => {
      const params = { page: 1, limit: 20, search: "test" };
      quizRepository.findAllAdmin.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      const result = await service.getQuizzesAdmin(params);

      expect(quizRepository.findAllAdmin).toHaveBeenCalledWith(params);
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
    });
  });

  describe("createQuiz", () => {
    it("should call repository create method", async () => {
      const quizData = {
        lessonId: "lesson-123",
        title: "New Quiz",
        description: "Description",
        type: QuizType.MULTIPLE_CHOICE,
        questions: [],
      };
      quizRepository.create.mockResolvedValue(mockQuiz);

      const result = await service.createQuiz(quizData);

      expect(quizRepository.create).toHaveBeenCalledWith(quizData);
      expect(result).toEqual(mockQuiz);
    });
  });

  describe("updateQuiz", () => {
    it("should update quiz and invalidate cache", async () => {
      quizRepository.update.mockResolvedValue({
        ...mockQuiz,
        title: "Updated Title",
      });

      const result = await service.updateQuiz(mockQuizId, {
        title: "Updated Title",
      });

      expect(quizRepository.update).toHaveBeenCalledWith(mockQuizId, {
        title: "Updated Title",
      });
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
      );
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("deleteQuiz", () => {
    it("should delete quiz and invalidate cache", async () => {
      quizRepository.delete.mockResolvedValue(mockQuiz);

      await service.deleteQuiz(mockQuizId);

      expect(quizRepository.delete).toHaveBeenCalledWith(mockQuizId);
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
      );
    });
  });

  describe("addQuestion", () => {
    it("should add question and invalidate cache", async () => {
      const questionData = {
        type: QuestionType.SINGLE_CHOICE,
        question: "New question?",
        answers: [{ answer: "Answer", isCorrect: true }],
      };
      const newQuestion = { ...questionData, id: "new-question-id" };
      quizRepository.addQuestion.mockResolvedValue(newQuestion as any);

      const result = await service.addQuestion(mockQuizId, questionData);

      expect(quizRepository.addQuestion).toHaveBeenCalledWith(
        mockQuizId,
        questionData,
      );
      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
      );
      expect(result).toEqual(newQuestion);
    });
  });

  describe("updateQuestion", () => {
    it("should call repository updateQuestion method", async () => {
      const updateData = { question: "Updated question?" };
      quizRepository.updateQuestion.mockResolvedValue({
        ...mockQuiz.questions[0],
        ...updateData,
      } as any);

      const result = await service.updateQuestion(mockQuestionId, updateData);

      expect(quizRepository.updateQuestion).toHaveBeenCalledWith(
        mockQuestionId,
        updateData,
      );
      expect(result.question).toBe("Updated question?");
    });
  });

  describe("deleteQuestion", () => {
    it("should call repository deleteQuestion method", async () => {
      quizRepository.deleteQuestion.mockResolvedValue(
        mockQuiz.questions[0] as any,
      );

      const result = await service.deleteQuestion(mockQuestionId);

      expect(quizRepository.deleteQuestion).toHaveBeenCalledWith(
        mockQuestionId,
      );
      expect(result).toBeDefined();
    });
  });

  describe("addAnswer", () => {
    it("should call repository addAnswer method", async () => {
      const answerData = { answer: "New answer", isCorrect: false };
      const newAnswer = {
        ...answerData,
        id: "new-answer-id",
        questionId: mockQuestionId,
      };
      quizRepository.addAnswer.mockResolvedValue(newAnswer as any);

      const result = await service.addAnswer(mockQuestionId, answerData);

      expect(quizRepository.addAnswer).toHaveBeenCalledWith(
        mockQuestionId,
        answerData,
      );
      expect(result).toEqual(newAnswer);
    });
  });

  describe("deleteAnswer", () => {
    it("should call repository deleteAnswer method", async () => {
      quizRepository.deleteAnswer.mockResolvedValue({
        id: mockAnswerId,
      } as any);

      const result = await service.deleteAnswer(mockAnswerId);

      expect(quizRepository.deleteAnswer).toHaveBeenCalledWith(mockAnswerId);
      expect(result).toBeDefined();
    });
  });

  describe("submitQuiz", () => {
    it("should throw NotFoundException when quiz not found", async () => {
      quizRepository.findByIdWithAnswers.mockResolvedValue(null);

      await expect(
        service.submitQuiz(mockUserId, mockQuizId, []),
      ).rejects.toThrow(NotFoundException);
    });

    it("should calculate score correctly for all correct answers", async () => {
      quizRepository.findByIdWithAnswers.mockResolvedValue(mockQuiz);

      const correctAnswerId = mockQuiz.questions[0].answers.find(
        (a) => a.isCorrect,
      )!.id;
      const answers = [
        { questionId: mockQuestionId, answerIds: [correctAnswerId] },
      ];

      prismaService.userQuizAttempt.create.mockResolvedValue({
        id: "attempt-123",
        userId: mockUserId,
        quizId: mockQuizId,
        score: 100,
        totalCorrect: 1,
        totalQuestions: 1,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.submitQuiz(mockUserId, mockQuizId, answers);

      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.totalCorrect).toBe(1);
      expect(result.totalQuestions).toBe(1);
    });

    it("should calculate score correctly for all wrong answers", async () => {
      quizRepository.findByIdWithAnswers.mockResolvedValue(mockQuiz);

      const wrongAnswerId = mockQuiz.questions[0].answers.find(
        (a) => !a.isCorrect,
      )!.id;
      const answers = [
        { questionId: mockQuestionId, answerIds: [wrongAnswerId] },
      ];

      prismaService.userQuizAttempt.create.mockResolvedValue({
        id: "attempt-123",
        userId: mockUserId,
        quizId: mockQuizId,
        score: 0,
        totalCorrect: 0,
        totalQuestions: 1,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.submitQuiz(mockUserId, mockQuizId, answers);

      expect(result.score).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.totalCorrect).toBe(0);
    });

    it("should award XP when quiz is passed", async () => {
      quizRepository.findByIdWithAnswers.mockResolvedValue(mockQuiz);

      const correctAnswerId = mockQuiz.questions[0].answers.find(
        (a) => a.isCorrect,
      )!.id;
      const answers = [
        { questionId: mockQuestionId, answerIds: [correctAnswerId] },
      ];

      prismaService.userQuizAttempt.create.mockResolvedValue({
        id: "attempt-123",
        userId: mockUserId,
        quizId: mockQuizId,
        score: 100,
        totalCorrect: 1,
        totalQuestions: 1,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prismaService.analyticsEvent.create.mockResolvedValue({});

      await service.submitQuiz(mockUserId, mockQuizId, answers);

      expect(pointsService.awardXp).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Number),
        "quiz",
      );
    });

    it("should invalidate cache after submission", async () => {
      quizRepository.findByIdWithAnswers.mockResolvedValue(mockQuiz);

      prismaService.userQuizAttempt.create.mockResolvedValue({
        id: "attempt-123",
        userId: mockUserId,
        quizId: mockQuizId,
        score: 0,
        totalCorrect: 0,
        totalQuestions: 1,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.submitQuiz(mockUserId, mockQuizId, []);

      expect(redisService.del).toHaveBeenCalledWith(
        CACHE_KEYS.QUIZ.DETAIL(mockQuizId),
      );
    });
  });

  describe("getQuizHistory", () => {
    it("should call repository getHistory method", async () => {
      const mockHistory = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasMore: false },
      };
      quizRepository.getHistory.mockResolvedValue(mockHistory);

      const result = await service.getQuizHistory(mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(quizRepository.getHistory).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe("getQuizAttempt", () => {
    it("should call repository getAttempt method", async () => {
      const mockAttempt = {
        id: "attempt-123",
        userId: mockUserId,
        quizId: mockQuizId,
        score: 100,
      };
      quizRepository.getAttempt.mockResolvedValue(mockAttempt as any);

      const result = await service.getQuizAttempt(mockUserId, "attempt-123");

      expect(quizRepository.getAttempt).toHaveBeenCalledWith(
        mockUserId,
        "attempt-123",
      );
      expect(result).toEqual(mockAttempt);
    });
  });
});
