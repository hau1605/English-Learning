import { Injectable, NotFoundException } from "@nestjs/common";
import { QuizRepository } from "@/modules/quiz/repositories/quiz.repository";
import { RedisService } from "@/common/redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "@/common/constants/cache-keys";
import { EventName } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { PointsService } from "@/modules/points/points.service";
import { QuizType } from "@prisma/client";

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly pointsService: PointsService,
  ) {}

  async getQuizById(id: string) {
    const cacheKey = CACHE_KEYS.QUIZ.DETAIL(id);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    await this.redis.setJson(cacheKey, quiz, CACHE_TTL.MEDIUM);

    return quiz;
  }

  async getQuizzes(params: {
    lessonId?: string;
    type?: string;
    limit?: number;
  }) {
    return this.quizRepository.findAll(params);
  }

  async getQuizzesAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: QuizType;
    lessonId?: string;
    published?: boolean;
  }) {
    return this.quizRepository.findAllAdmin(params);
  }

  async createQuiz(data: {
    lessonId?: string;
    title: string;
    description?: string;
    type: QuizType;
    durationSeconds?: number;
    passingScore?: number;
    maxAttempts?: number;
    isGenerated?: boolean;
    questions?: Array<{
      type: any;
      question: string;
      explanation?: string;
      audioUrl?: string;
      imageUrl?: string;
      orderIndex?: number;
      points?: number;
      answers: Array<{
        answer: string;
        isCorrect: boolean;
        orderIndex?: number;
      }>;
    }>;
  }) {
    return this.quizRepository.create(data);
  }

  async updateQuiz(
    id: string,
    data: {
      lessonId?: string;
      title?: string;
      description?: string;
      type?: QuizType;
      durationSeconds?: number;
      passingScore?: number;
      maxAttempts?: number;
      published?: boolean;
    },
  ) {
    const quiz = await this.quizRepository.update(id, data);
    await this.redis.del(CACHE_KEYS.QUIZ.DETAIL(id));
    return quiz;
  }

  async deleteQuiz(id: string) {
    await this.quizRepository.delete(id);
    await this.redis.del(CACHE_KEYS.QUIZ.DETAIL(id));
  }

  async addQuestion(
    quizId: string,
    data: {
      type: any;
      question: string;
      explanation?: string;
      audioUrl?: string;
      imageUrl?: string;
      orderIndex?: number;
      points?: number;
      answers: Array<{
        answer: string;
        isCorrect: boolean;
        orderIndex?: number;
      }>;
    },
  ) {
    const question = await this.quizRepository.addQuestion(quizId, data);
    await this.redis.del(CACHE_KEYS.QUIZ.DETAIL(quizId));
    return question;
  }

  async updateQuestion(
    questionId: string,
    data: {
      type?: any;
      question?: string;
      explanation?: string;
      audioUrl?: string;
      imageUrl?: string;
      orderIndex?: number;
      points?: number;
    },
  ) {
    return this.quizRepository.updateQuestion(questionId, data);
  }

  async deleteQuestion(questionId: string) {
    return this.quizRepository.deleteQuestion(questionId);
  }

  async addAnswer(
    questionId: string,
    data: { answer: string; isCorrect: boolean; orderIndex?: number },
  ) {
    return this.quizRepository.addAnswer(questionId, data);
  }

  async deleteAnswer(answerId: string) {
    return this.quizRepository.deleteAnswer(answerId);
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    answers: { questionId: string; answerIds: string[] }[],
  ) {
    const quiz = await this.quizRepository.findByIdWithAnswers(quizId);
    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    let totalCorrect = 0;
    const questionResults: {
      questionId: string;
      correct: boolean;
      correctAnswerIds: string[];
    }[] = [];

    for (const quizQuestion of quiz.questions) {
      const userAnswer = answers.find((a) => a.questionId === quizQuestion.id);
      const correctAnswerIds = quizQuestion.answers
        .filter((a: any) => a.isCorrect)
        .map((a: any) => a.id);

      const isCorrect =
        userAnswer &&
        correctAnswerIds.length === userAnswer.answerIds.length &&
        correctAnswerIds.every((id: string) =>
          userAnswer.answerIds.includes(id),
        );

      if (isCorrect) {
        totalCorrect++;
      }

      questionResults.push({
        questionId: quizQuestion.id,
        correct: isCorrect || false,
        correctAnswerIds,
      });
    }

    const totalQuestions = quiz.questions.length;
    const score = Math.round((totalCorrect / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    const xpEarned = passed ? Math.round(20 + score * 0.5) : 0;

    const attempt = await this.prisma.userQuizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        totalCorrect,
        totalQuestions,
        submittedAt: new Date(),
        timeSpent: 0,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.userDailyStat.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        quizzesCompleted: 1,
        xpEarned,
      },
      update: {
        quizzesCompleted: { increment: 1 },
        xpEarned: { increment: xpEarned },
      },
    });

    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: EventName.QUIZ_COMPLETED,
        metadata: {
          quizId,
          score,
          passed,
          xpEarned,
        },
      },
    });

    if (xpEarned > 0) {
      await this.pointsService.awardXp(userId, xpEarned, "quiz");
    }

    await this.redis.del(CACHE_KEYS.QUIZ.DETAIL(quizId));

    return {
      attemptId: attempt.id,
      score,
      totalCorrect,
      totalQuestions,
      passed,
      questionResults,
    };
  }

  async getQuizHistory(
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    return this.quizRepository.getHistory(userId, params);
  }

  async getQuizAttempt(userId: string, attemptId: string) {
    return this.quizRepository.getAttempt(userId, attemptId);
  }
}
