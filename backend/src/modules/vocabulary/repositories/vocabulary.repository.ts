import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

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
export class VocabularyRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAllTopics() {
    const cacheKey = CACHE_KEYS.VOCABULARY.TOPICS;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const topics = await this.prisma.topic.findMany({
      include: {
        _count: {
          select: { vocabularies: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    await this.redis.setJson(cacheKey, topics, CACHE_TTL.MEDIUM);
    return topics;
  }

  async findAllTopicsAdmin() {
    return this.prisma.topic.findMany({
      include: {
        _count: {
          select: { vocabularies: true },
        },
        vocabularies: {
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findTopicBySlug(slug: string) {
    const cacheKey = CACHE_KEYS.VOCABULARY.TOPIC(slug);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      include: {
        vocabularies: {
          orderBy: { word: 'asc' },
        },
      },
    });

    if (topic) {
      await this.redis.setJson(cacheKey, topic, CACHE_TTL.LONG);
    }
    return topic;
  }

  async findTopicById(id: string): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    vocabularies: { id: string }[];
    [key: string]: any;
  } | null> {
    const cacheKey = CACHE_KEYS.VOCABULARY.TOPIC(id);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached as { id: string; name: string; slug: string; description: string | null; icon: string | null; vocabularies: { id: string }[]; [key: string]: any };
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        vocabularies: {
          select: { id: true },
        },
      },
    });

    if (topic) {
      await this.redis.setJson(cacheKey, topic, CACHE_TTL.LONG);
    }
    return topic;
  }

  async invalidateTopicCache(topicId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.VOCABULARY.TOPIC(topicId));
    await this.redis.del(CACHE_KEYS.VOCABULARY.TOPICS);
  }

  async findVocabulariesByTopic(topicId: string) {
    return this.prisma.vocabulary.findMany({
      where: { topicId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { word: 'asc' },
    });
  }

  async search(query: string, limit: number) {
    return this.prisma.vocabulary.findMany({
      where: {
        OR: [
          { word: { contains: query, mode: 'insensitive' } },
          { meaning: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { word: 'asc' },
      include: {
        topic: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.vocabulary.findUnique({
      where: { id },
      include: {
        topic: true,
      },
    });
  }

  async findAllWithPagination(params: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: number;
  }): Promise<PaginationResult<any>> {
    const { page = 1, limit = 20, search, difficulty } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { meaning: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [data, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where,
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vocabulary.count({ where }),
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

  async createTopic(data: { name: string; slug: string; description?: string; icon?: string }) {
    const result = await this.prisma.topic.create({
      data,
    });
    await this.invalidateTopicCache(result.id);
    return result;
  }

  async updateTopic(id: string, data: { name?: string; description?: string; icon?: string }) {
    const result = await this.prisma.topic.update({
      where: { id },
      data,
    });
    await this.invalidateTopicCache(id);
    return result;
  }

  async deleteTopic(id: string) {
    const result = await this.prisma.topic.delete({
      where: { id },
    });
    await this.invalidateTopicCache(id);
    return result;
  }

  async createVocabulary(data: {
    topicId: string;
    word: string;
    pronunciation?: string;
    meaning: string;
    example?: string;
    exampleTranslation?: string;
    audioUrl?: string;
    imageUrl?: string;
    difficulty?: number;
    partOfSpeech?: string;
  }) {
    const result = await this.prisma.vocabulary.create({
      data,
      include: {
        topic: true,
      },
    });
    await this.invalidateTopicCache(data.topicId);
    return result;
  }

  async updateVocabulary(id: string, data: {
    word?: string;
    pronunciation?: string;
    meaning?: string;
    example?: string;
    exampleTranslation?: string;
    audioUrl?: string;
    imageUrl?: string;
    difficulty?: number;
    partOfSpeech?: string;
  }) {
    // Get current vocabulary to know topicId for cache invalidation
    const current = await this.prisma.vocabulary.findUnique({
      where: { id },
      select: { topicId: true },
    });

    const result = await this.prisma.vocabulary.update({
      where: { id },
      data,
      include: {
        topic: true,
      },
    });

    // Invalidate both old and new topic caches
    await this.invalidateTopicCache(result.topicId);
    if (current && current.topicId !== result.topicId) {
      await this.invalidateTopicCache(current.topicId);
    }
    return result;
  }

  async deleteVocabulary(id: string) {
    const current = await this.prisma.vocabulary.findUnique({
      where: { id },
      select: { topicId: true },
    });

    const result = await this.prisma.vocabulary.delete({
      where: { id },
    });

    if (current) {
      await this.invalidateTopicCache(current.topicId);
    }
    return result;
  }

  async createBulkVocabulary(data: Array<{
    topicId: string;
    word: string;
    pronunciation?: string;
    meaning: string;
    example?: string;
    exampleTranslation?: string;
    audioUrl?: string;
    imageUrl?: string;
    difficulty?: number;
    partOfSpeech?: string;
  }>) {
    return this.prisma.vocabulary.createMany({
      data,
    });
  }

  async findVocabulariesForExport(where: any = {}): Promise<Array<{
    id: string;
    word: string;
    pronunciation: string | null;
    meaning: string;
    example: string | null;
    exampleTranslation: string | null;
    difficulty: number;
    partOfSpeech: string | null;
    topic: { name: string } | null;
  }>> {
    return this.prisma.vocabulary.findMany({
      where,
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { topic: { name: 'asc' } },
        { word: 'asc' },
      ],
    });
  }
}
