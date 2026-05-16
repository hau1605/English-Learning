import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QuizType } from '@prisma/client';

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class QuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }

  async findByIdWithAnswers(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }

  async findAll(params: { lessonId?: string; type?: string; limit?: number }) {
    const where: any = {};
    if (params.lessonId) {
      where.lessonId = params.lessonId;
    }
    if (params.type) {
      where.type = params.type;
    }

    return this.prisma.quiz.findMany({
      where,
      include: {
        _count: {
          select: { questions: true },
        },
      },
      take: params.limit || 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: QuizType;
    lessonId?: string;
    published?: boolean;
  }): Promise<PaginationResult<any>> {
    const { page = 1, limit = 20, search, type, lessonId, published } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (lessonId) {
      where.lessonId = lessonId;
    }

    if (published !== undefined) {
      where.publishedAt = published ? { not: null } : null;
    }

    const [data, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: {
          lesson: {
            select: { id: true, title: true },
          },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: {
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
      answers: Array<{ answer: string; isCorrect: boolean; orderIndex?: number }>;
    }>;
  }) {
    const { questions, ...quizData } = data;

    return this.prisma.quiz.create({
      data: {
        ...quizData,
        ...(questions && questions.length > 0 && {
          questions: {
            create: questions.map((q, qIndex) => ({
              ...q,
              orderIndex: q.orderIndex ?? qIndex,
              answers: {
                create: q.answers.map((a, aIndex) => ({
                  ...a,
                  orderIndex: a.orderIndex ?? aIndex,
                })),
              },
            })),
          },
        }),
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  async update(id: string, data: {
    lessonId?: string;
    title?: string;
    description?: string;
    type?: QuizType;
    durationSeconds?: number;
    passingScore?: number;
    maxAttempts?: number;
    published?: boolean;
  }) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const updateData: any = { ...data };
    
    if (data.published !== undefined) {
      updateData.publishedAt = data.published ? new Date() : null;
      delete updateData.published;
    }

    return this.prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return this.prisma.quiz.delete({
      where: { id },
    });
  }

  async addQuestion(quizId: string, data: {
    type: any;
    question: string;
    explanation?: string;
    audioUrl?: string;
    imageUrl?: string;
    orderIndex?: number;
    points?: number;
    answers: Array<{ answer: string; isCorrect: boolean; orderIndex?: number }>;
  }) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questionCount = await this.prisma.quizQuestion.count({ where: { quizId } });

    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        type: data.type,
        question: data.question,
        explanation: data.explanation,
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
        orderIndex: data.orderIndex ?? questionCount,
        points: data.points ?? 1,
        answers: {
          create: data.answers.map((a, index) => ({
            answer: a.answer,
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex ?? index,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async updateQuestion(questionId: string, data: {
    type?: any;
    question?: string;
    explanation?: string;
    audioUrl?: string;
    imageUrl?: string;
    orderIndex?: number;
    points?: number;
  }) {
    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data,
      include: {
        answers: true,
      },
    });
  }

  async deleteQuestion(questionId: string) {
    return this.prisma.quizQuestion.delete({
      where: { id: questionId },
    });
  }

  async addAnswer(questionId: string, data: { answer: string; isCorrect: boolean; orderIndex?: number }) {
    const answerCount = await this.prisma.quizAnswer.count({ where: { questionId } });

    return this.prisma.quizAnswer.create({
      data: {
        questionId,
        answer: data.answer,
        isCorrect: data.isCorrect,
        orderIndex: data.orderIndex ?? answerCount,
      },
    });
  }

  async deleteAnswer(answerId: string) {
    return this.prisma.quizAnswer.delete({
      where: { id: answerId },
    });
  }

  async getHistory(userId: string, params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.userQuizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              type: true,
              passingScore: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userQuizAttempt.count({ where: { userId } }),
    ]);

    return {
      data: attempts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async getAttempt(userId: string, attemptId: string) {
    return this.prisma.userQuizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });
  }
}
