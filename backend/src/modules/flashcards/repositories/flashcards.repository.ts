import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

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
export class FlashcardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toUserFlashcardPayload(review: any) {
    return {
      ...review,
      vocabulary: review.flashcard.vocabulary,
    };
  }

  private toNewFlashcardPayload(flashcard: any) {
    return {
      id: flashcard.id,
      flashcardId: flashcard.id,
      vocabularyId: flashcard.vocabularyId,
      repetitionCount: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: new Date(),
      lastReviewedAt: null,
      correctStreak: 0,
      wrongCount: 0,
      totalReviews: 0,
      createdAt: flashcard.createdAt,
      updatedAt: flashcard.updatedAt,
      flashcard,
      vocabulary: flashcard.vocabulary,
    };
  }

  async getDueCards(userId: string, limit: number) {
    const now = new Date();

    const reviewedDueCards = await this.prisma.userFlashcardReview.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      include: {
        flashcard: {
          include: {
            vocabulary: {
              select: {
                id: true,
                word: true,
                pronunciation: true,
                meaning: true,
                example: true,
                audioUrl: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: [
        { nextReviewAt: 'asc' },
        { easeFactor: 'asc' },
      ],
      take: limit,
    });
    console.log('Reviewed due cards:', reviewedDueCards);

    const remainingLimit = Math.max(0, limit - reviewedDueCards.length);
    if (remainingLimit === 0) {
      return reviewedDueCards.map((review) => this.toUserFlashcardPayload(review));
    }

    const newCards = await this.prisma.flashcard.findMany({
      where: {
        reviews: {
          none: { userId },
        },
      },
      include: {
        vocabulary: {
          select: {
            id: true,
            word: true,
            pronunciation: true,
            meaning: true,
            example: true,
            audioUrl: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: remainingLimit,
    });

    return [
      ...reviewedDueCards.map((review) => this.toUserFlashcardPayload(review)),
      ...newCards.map((flashcard) => this.toNewFlashcardPayload(flashcard)),
    ];
  }

  async getStats(userId: string) {
    const [totalReviews, totalCards, dueReviewedCards, unreviewedCards, masteredCards] = await Promise.all([
      this.prisma.userFlashcardReview.aggregate({
        where: { userId },
        _sum: { totalReviews: true },
      }),
      this.prisma.flashcard.count(),
      this.prisma.userFlashcardReview.count({
        where: {
          userId,
          nextReviewAt: { lte: new Date() },
        },
      }),
      this.prisma.flashcard.count({
        where: {
          reviews: {
            none: { userId },
          },
        },
      }),
      this.prisma.userFlashcardReview.count({
        where: {
          userId,
          intervalDays: { gte: 21 },
        },
      }),
    ]);

    const reviewsByDay = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "user_flashcard_reviews"
      WHERE "userId" = ${userId}
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    return {
      totalReviews: totalReviews._sum.totalReviews || 0,
      totalCards,
      dueCards: dueReviewedCards + unreviewedCards,
      masteredCards,
      reviewsByDay: reviewsByDay.map((r: any) => ({
        date: r.date,
        count: Number(r.count),
      })),
    };
  }

  async getAllForUser(userId: string, topicId?: string) {
    const flashcardWhere: any = {};

    if (topicId) {
      flashcardWhere.vocabulary = { topicId };
    }

    const flashcards = await this.prisma.flashcard.findMany({
      where: flashcardWhere,
      include: {
        vocabulary: true,
        reviews: {
          where: { userId },
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return flashcards.map((flashcard) => {
      const review = flashcard.reviews[0];
      const { reviews, ...card } = flashcard;

      if (review) {
        return {
          ...review,
          flashcard: card,
          vocabulary: card.vocabulary,
        };
      }

      return this.toNewFlashcardPayload(card);
    });
  }

  async findById(id: string) {
    return this.prisma.flashcard.findUnique({
      where: { id },
      include: {
        vocabulary: {
          include: {
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    topicId?: string;
    difficulty?: number;
  }): Promise<PaginationResult<any>> {
    const { page = 1, limit = 20, search, topicId, difficulty } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (topicId) {
      where.vocabulary = { topicId };
    }

    if (difficulty) {
      where.vocabulary = { ...where.vocabulary, difficulty };
    }

    if (search) {
      where.OR = [
        { frontContent: { contains: search, mode: 'insensitive' } },
        { backContent: { contains: search, mode: 'insensitive' } },
        { vocabulary: { word: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.flashcard.findMany({
        where,
        include: {
          vocabulary: {
            select: {
              id: true,
              word: true,
              meaning: true,
              topic: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.flashcard.count({ where }),
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

  async create(dto: { vocabularyId: string; frontContent: string; backContent: string; audioUrl?: string; imageUrl?: string; hint?: string }) {
    return this.prisma.flashcard.create({
      data: {
        vocabularyId: dto.vocabularyId,
        frontContent: dto.frontContent,
        backContent: dto.backContent,
        audioUrl: dto.audioUrl,
        imageUrl: dto.imageUrl,
        hint: dto.hint,
      },
      include: {
        vocabulary: {
          include: {
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: { frontContent?: string; backContent?: string; audioUrl?: string; imageUrl?: string; hint?: string }) {
    return this.prisma.flashcard.update({
      where: { id },
      data,
      include: {
        vocabulary: {
          include: {
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.flashcard.delete({
      where: { id },
    });
  }

  async createBulk(dto: Array<{ vocabularyId: string; frontContent: string; backContent: string; audioUrl?: string; imageUrl?: string; hint?: string }>) {
    return this.prisma.flashcard.createMany({
      data: dto,
    });
  }

  async generateFromVocabulary(vocabularyId: string) {
    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });

    if (!vocab) {
      throw new Error('Vocabulary not found');
    }

    return this.prisma.flashcard.create({
      data: {
        vocabularyId,
        frontContent: `What does "${vocab.word}" mean?`,
        backContent: vocab.meaning,
        hint: vocab.pronunciation || undefined,
      },
      include: {
        vocabulary: {
          include: {
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }
}
