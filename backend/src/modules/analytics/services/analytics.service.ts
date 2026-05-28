import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getUserStats(userId: string) {
    const cacheKey = CACHE_KEYS.ANALYTICS.USER(userId);

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const [dailyStats, totalStats] = await Promise.all([
      this.prisma.userDailyStat.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      this.prisma.userDailyStat.aggregate({
        where: { userId },
        _sum: {
          learnedWords: true,
          flashcardsReviewed: true,
          quizzesCompleted: true,
          studyMinutes: true,
          xpEarned: true,
        },
      }),
    ]);

    const result = {
      dailyStats,
      total: totalStats._sum,
    };

    await this.redis.setJson(cacheKey, result, CACHE_TTL.MEDIUM);

    return result;
  }

  async getLeaderboard(type: 'global' | 'weekly' | 'monthly' = 'global', limit: number = 100) {
    const cacheKey = type === 'global'
      ? CACHE_KEYS.LEADERBOARD.GLOBAL
      : type === 'weekly'
        ? CACHE_KEYS.LEADERBOARD.WEEKLY
        : CACHE_KEYS.LEADERBOARD.MONTHLY;

    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const leaderboard = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        level: true,
        xp: true,
        streakDays: true,
      },
      orderBy: { xp: 'desc' },
      take: limit,
    });

    const result = leaderboard.map((user: any, index: number) => ({
      rank: index + 1,
      ...user,
    }));

    await this.redis.setJson(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  }

  async trackEvent(userId: string | null, eventName: string, metadata?: Record<string, any>) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventName,
        metadata,
      },
    });
  }
}
