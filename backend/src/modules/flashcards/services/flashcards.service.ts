import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { FlashcardsRepository } from "@/modules/flashcards/repositories/flashcards.repository";
import { UsersService } from "@/modules/users/services/users.service";
import { VocabularyService } from "@/modules/vocabulary/services/vocabulary.service";
import { RedisService } from "@/common/redis/redis.service";
import { CACHE_KEYS } from "@/common/constants/cache-keys";
import { calculateSpacedRepetition } from "@/common/utils";
import { FlashcardRating, EventName } from "@/common/enums";
import { ReviewFlashcardDto } from "@/modules/flashcards/dto/review-flashcard.dto";
import { CreateFlashcardDto } from "@/modules/flashcards/dto/create-flashcard.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { PointsService } from "@/modules/points/points.service";

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(
    private readonly flashcardsRepository: FlashcardsRepository,
    private readonly usersService: UsersService,
    private readonly vocabularyService: VocabularyService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly pointsService: PointsService,
  ) {}

  async getDueCards(userId: string, limit: number = 20) {
    const cacheKey = CACHE_KEYS.FLASHCARD.DUE(userId);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const cards = await this.flashcardsRepository.getDueCards(userId, limit);

    await this.redis.setJson(cacheKey, cards, 60);

    return cards;
  }

  async reviewFlashcard(userId: string, dto: ReviewFlashcardDto) {
    const flashcard = await this.flashcardsRepository.findById(dto.flashcardId);
    if (!flashcard) {
      throw new NotFoundException("Flashcard not found");
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      let review = await tx.userFlashcardReview.findUnique({
        where: {
          userId_flashcardId: {
            userId,
            flashcardId: dto.flashcardId,
          },
        },
      });

      if (!review) {
        review = await tx.userFlashcardReview.create({
          data: {
            userId,
            flashcardId: dto.flashcardId,
            vocabularyId: flashcard.vocabularyId,
            nextReviewAt: new Date(),
          },
        });
      }

      const { repetitionCount, easeFactor, intervalDays, nextReviewAt } =
        calculateSpacedRepetition(
          dto.rating,
          review.repetitionCount,
          review.easeFactor,
          review.intervalDays,
        );

      const isCorrect = dto.rating >= FlashcardRating.GOOD;
      const xpEarned = isCorrect ? Math.round(10 * easeFactor) : 0;

      await tx.userFlashcardReview.update({
        where: { id: review.id },
        data: {
          repetitionCount,
          easeFactor,
          intervalDays,
          nextReviewAt,
          lastReviewedAt: new Date(),
          correctStreak: isCorrect ? review.correctStreak + 1 : 0,
          wrongCount: isCorrect ? review.wrongCount : review.wrongCount + 1,
          totalReviews: review.totalReviews + 1,
        },
      });

      if (xpEarned > 0) {
        await this.pointsService.awardXpWithinTransaction(tx, userId, xpEarned);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await tx.userDailyStat.upsert({
          where: {
            userId_date: {
              userId,
              date: today,
            },
          },
          create: {
            userId,
            date: today,
            flashcardsReviewed: 1,
            xpEarned,
          },
          update: {
            flashcardsReviewed: { increment: 1 },
            xpEarned: { increment: xpEarned },
          },
        });
      }

      await tx.analyticsEvent.create({
        data: {
          userId,
          eventName: EventName.FLASHCARD_REVIEWED,
          metadata: {
            flashcardId: dto.flashcardId,
            rating: dto.rating,
            xpEarned,
            isCorrect,
          },
        },
      });

      return {
        flashcardId: dto.flashcardId,
        isCorrect,
        xpEarned,
        nextReviewAt,
        easeFactor,
        intervalDays,
      };
    });

    await this.redis.del(CACHE_KEYS.FLASHCARD.DUE(userId));
    await this.redis.del(CACHE_KEYS.FLASHCARD.STATS(userId));

    if (result.xpEarned > 0) {
      await this.pointsService.finalizeXpAward(
        userId,
        result.xpEarned,
        "flashcard",
      );
    }

    this.logger.log(
      `Flashcard reviewed: user=${userId}, rating=${dto.rating}, xp=${result.xpEarned}`,
    );

    return result;
  }

  async getStats(userId: string) {
    const cacheKey = CACHE_KEYS.FLASHCARD.STATS(userId);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.flashcardsRepository.getStats(userId);

    await this.redis.setJson(cacheKey, stats, 300);

    return stats;
  }

  async getAllFlashcards(userId: string, topicId?: string) {
    return this.flashcardsRepository.getAllForUser(userId, topicId);
  }

  async createFlashcard(dto: CreateFlashcardDto) {
    const vocabulary = await this.vocabularyService.getVocabularyById(
      dto.vocabularyId,
    );
    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID "${dto.vocabularyId}" not found`,
      );
    }
    return this.flashcardsRepository.create(dto);
  }

  async resetProgress(userId: string, flashcardId?: string) {
    if (flashcardId) {
      await this.prisma.userFlashcardReview.deleteMany({
        where: { userId, flashcardId },
      });
    } else {
      await this.prisma.userFlashcardReview.deleteMany({
        where: { userId },
      });
    }

    await this.redis.del(CACHE_KEYS.FLASHCARD.DUE(userId));
    await this.redis.del(CACHE_KEYS.FLASHCARD.STATS(userId));
  }

  // ========== ADMIN METHODS ==========

  async getFlashcardsAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    topicId?: string;
    difficulty?: number;
  }) {
    return this.flashcardsRepository.findAllAdmin(params);
  }

  async getFlashcardById(id: string) {
    const flashcard = await this.flashcardsRepository.findById(id);
    if (!flashcard) {
      throw new NotFoundException("Flashcard not found");
    }
    return flashcard;
  }

  async updateFlashcard(
    id: string,
    data: {
      frontContent?: string;
      backContent?: string;
      audioUrl?: string;
      imageUrl?: string;
      hint?: string;
    },
  ) {
    const flashcard = await this.flashcardsRepository.findById(id);
    if (!flashcard) {
      throw new NotFoundException("Flashcard not found");
    }
    return this.flashcardsRepository.update(id, data);
  }

  async deleteFlashcard(id: string) {
    const flashcard = await this.flashcardsRepository.findById(id);
    if (!flashcard) {
      throw new NotFoundException("Flashcard not found");
    }
    return this.flashcardsRepository.delete(id);
  }

  async createBulkFlashcards(
    dto: Array<{
      vocabularyId: string;
      frontContent: string;
      backContent: string;
      audioUrl?: string;
      imageUrl?: string;
      hint?: string;
    }>,
  ) {
    const vocabularyIds = [...new Set(dto.map((item) => item.vocabularyId))];
    const existingVocabularies = await this.prisma.vocabulary.findMany({
      where: { id: { in: vocabularyIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingVocabularies.map((v) => v.id));

    const invalidVocabularyIds = vocabularyIds.filter(
      (id) => !existingIds.has(id),
    );

    if (invalidVocabularyIds.length > 0) {
      throw new NotFoundException(
        `Vocabulary IDs not found: ${invalidVocabularyIds.join(", ")}`,
      );
    }

    return this.flashcardsRepository.createBulk(dto);
  }

  async generateFlashcardFromVocabulary(vocabularyId: string) {
    return this.flashcardsRepository.generateFromVocabulary(vocabularyId);
  }
}
