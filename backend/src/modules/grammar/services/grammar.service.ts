import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

@Injectable()
export class GrammarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getCategories() {
    const cacheKey = CACHE_KEYS.GRAMMAR.CATEGORIES;

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.grammarCategory.findMany({
      include: {
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    await this.redis.setJson(cacheKey, categories, CACHE_TTL.EXTRA_LONG);

    return categories;
  }

  async getLessonBySlug(slug: string) {
    const cacheKey = CACHE_KEYS.GRAMMAR.LESSON(slug);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const lesson = await this.prisma.grammarLesson.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (lesson) {
      await this.redis.setJson(cacheKey, lesson, CACHE_TTL.LONG);
    }

    return lesson;
  }

  async getLessonsByCategory(categoryId: string) {
    return this.prisma.grammarLesson.findMany({
      where: {
        categoryId,
        deletedAt: null,
      },
      orderBy: { title: 'asc' },
    });
  }
}
