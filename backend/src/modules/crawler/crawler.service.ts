import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";

interface CrawledVocabularyItem {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string[];
  definitions?: { meaning: string; example?: string }[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  difficulty?: number;
  cefrLevel?: string;
  source?: string;
  sourceUrl?: string;
}

interface CrawledGrammarLesson {
  title: string;
  category: string;
  explanation: string;
  examples?: { sentence: string; explanation?: string; translation?: string }[];
  exercises?: {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
  }[];
  difficulty?: number;
  cefrLevel?: string;
  source?: string;
  sourceUrl?: string;
}

interface ImportResult {
  added: number;
  updated: number;
  failed: number;
}

interface CrawledTopicItem {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly CRAWLER_API_URL =
    process.env.CRAWLER_API_URL || "http://localhost:8000";
  private defaultTopicId: string | null = null;

  constructor(
    @InjectQueue("crawler")
    private crawlerQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async importVocabulary(
    items: CrawledVocabularyItem[],
  ): Promise<ImportResult> {
    let added = 0;
    let updated = 0;
    let failed = 0;

    const topicId = await this.getOrCreateDefaultTopic();

    for (const item of items) {
      try {
        const existing = await this.prisma.vocabulary.findFirst({
          where: { word: item.word.toLowerCase() },
        });

        const data = {
          word: item.word.toLowerCase(),
          pronunciation: item.phonetic || null,
          audioUrl: item.audioUrl || null,
          meaning: item.definitions?.[0]?.meaning || item.examples?.[0] || "",
          example: item.examples?.slice(0, 3).join(" | ") || null,
          exampleTranslation: item.definitions?.[0]?.example || null,
          difficulty: item.difficulty || 3,
          partOfSpeech: item.partOfSpeech?.join(", ") || null,
          imageUrl: null,
          topicId,
        };

        if (existing) {
          await this.prisma.vocabulary.update({
            where: { id: existing.id },
            data,
          });
          updated++;
        } else {
          await this.prisma.vocabulary.create({ data });
          added++;
        }
      } catch (error) {
        this.logger.error(`Failed to import vocabulary: ${item.word}`, error);
        failed++;
      }
    }

    this.logger.log(
      `Vocabulary import completed: ${added} added, ${updated} updated, ${failed} failed`,
    );
    return { added, updated, failed };
  }

  async importGrammar(
    lessons: CrawledGrammarLesson[],
  ): Promise<{ added: number; updated: number }> {
    let added = 0;
    let updated = 0;

    for (const lesson of lessons) {
      try {
        const existing = await this.prisma.grammarLesson.findFirst({
          where: { title: lesson.title },
        });

        let categoryId = await this.getOrCreateCategory(lesson.category);

        const data = {
          title: lesson.title,
          slug: this.slugify(lesson.title),
          explanation: lesson.explanation,
          examples: (lesson.examples as any) || [],
          exercises: (lesson.exercises as any) || [],
          difficulty: lesson.difficulty || 3,
          publishedAt: new Date(),
          categoryId,
        };

        if (existing) {
          await this.prisma.grammarLesson.update({
            where: { id: existing.id },
            data,
          });
          updated++;
        } else {
          await this.prisma.grammarLesson.create({ data });
          added++;
        }
      } catch (error) {
        this.logger.error(`Failed to import grammar: ${lesson.title}`, error);
      }
    }

    return { added, updated };
  }

  async importTopics(topics: CrawledTopicItem[]): Promise<ImportResult> {
    let added = 0;
    let updated = 0;
    let failed = 0;

    for (const topic of topics) {
      try {
        const existing = await this.prisma.topic.findUnique({
          where: { slug: topic.slug },
        });

        const data = {
          name: topic.name,
          slug: topic.slug,
          icon: topic.icon || null,
          description: topic.description || null,
        };

        if (existing) {
          await this.prisma.topic.update({
            where: { id: existing.id },
            data,
          });
          updated++;
        } else {
          await this.prisma.topic.create({ data });
          added++;
        }
      } catch (error) {
        this.logger.error(`Failed to import topic: ${topic.slug}`, error);
        failed++;
      }
    }

    return { added, updated, failed };
  }

  private async getOrCreateDefaultTopic(): Promise<string> {
    if (this.defaultTopicId) {
      return this.defaultTopicId;
    }

    let topic = await this.prisma.topic.findUnique({
      where: { slug: "crawled" },
    });

    if (!topic) {
      topic = await this.prisma.topic.create({
        data: {
          name: "Crawled Vocabulary",
          slug: "crawled",
          description: "Vocabulary imported from external sources",
          icon: "📚",
        },
      });
    }

    this.defaultTopicId = topic.id;
    return topic.id;
  }

  private async getOrCreateCategory(name: string): Promise<string> {
    const slug = this.slugify(name);

    let category = await this.prisma.grammarCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      category = await this.prisma.grammarCategory.create({
        data: {
          name: name,
          slug,
          description: `Grammar lessons for ${name}`,
        },
      });
    }

    return category.id;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async triggerVocabularyCrawl(dto: {
    words: string[];
    source?: string;
    pushToBackend?: boolean;
  }) {
    const job = await this.crawlerQueue.add("vocabulary-crawl", {
      words: dto.words,
      source: dto.source || "free_dictionary",
      pushToBackend: dto.pushToBackend ?? true,
    });

    return job;
  }

  async triggerGrammarCrawl(dto: {
    categories?: string[];
    pushToBackend?: boolean;
  }) {
    const job = await this.crawlerQueue.add("grammar-crawl", {
      categories: dto.categories || ["basic", "intermediate", "advanced"],
      pushToBackend: dto.pushToBackend ?? true,
    });

    return job;
  }

  async getJobs(status?: string) {
    const jobs = await this.crawlerQueue.getJobs(
      ["waiting", "active", "completed", "failed"],
      0,
      100,
    );

    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        status: await job.getState(),
        data: job.data,
        progress: job.progress,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      })),
    );
  }

  async getJobStatus(jobId: string) {
    const job = await this.crawlerQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      status: await job.getState(),
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  async getSources() {
    return [
      {
        key: "free_dictionary",
        name: "Free Dictionary API",
        type: "api",
        contentType: "vocabulary",
        requiresBrowser: false,
        rateLimit: 0.5,
      },
      {
        key: "oxford",
        name: "Oxford Learner's Dictionary",
        type: "web",
        contentType: "vocabulary",
        requiresBrowser: true,
        rateLimit: 2.0,
      },
      {
        key: "english_grammar",
        name: "English Grammar Online",
        type: "web",
        contentType: "grammar",
        requiresBrowser: true,
        rateLimit: 2.0,
      },
    ];
  }

  async getLogs(limit: number = 50) {
    return [];
  }

  async getStats() {
    const totalSources = 3;
    return {
      totalSources,
      totalCrawledToday: 0,
      totalFailedToday: 0,
      successRate: 100,
    };
  }
}
