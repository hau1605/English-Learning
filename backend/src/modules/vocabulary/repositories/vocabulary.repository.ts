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
export class VocabularyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTopics() {
    return this.prisma.topic.findMany({
      include: {
        _count: {
          select: { vocabularies: true },
        },
      },
      orderBy: { name: 'asc' },
    });
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
    return this.prisma.topic.findUnique({
      where: { slug },
      include: {
        vocabularies: {
          orderBy: { word: 'asc' },
        },
      },
    });
  }

  async findTopicById(id: string) {
    return this.prisma.topic.findUnique({
      where: { id },
      include: {
        vocabularies: {
          select: { id: true },
        },
      },
    });
  }

  async findVocabulariesByTopic(topicId: string) {
    return this.prisma.vocabulary.findMany({
      where: { topicId },
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
    return this.prisma.topic.create({
      data,
    });
  }

  async updateTopic(id: string, data: { name?: string; description?: string; icon?: string }) {
    return this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  async deleteTopic(id: string) {
    return this.prisma.topic.delete({
      where: { id },
    });
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
    return this.prisma.vocabulary.create({
      data,
      include: {
        topic: true,
      },
    });
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
    return this.prisma.vocabulary.update({
      where: { id },
      data,
      include: {
        topic: true,
      },
    });
  }

  async deleteVocabulary(id: string) {
    return this.prisma.vocabulary.delete({
      where: { id },
    });
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

  async findVocabulariesForExport(where: any = {}) {
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
