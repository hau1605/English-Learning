import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

export interface LeaderboardUser {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streakDays?: number;
  rank: number;
  weekXp?: number;
  monthXp?: number;
}

@Injectable()
export class LeaderboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardUser[]> {
    const cacheKey = CACHE_KEYS.LEADERBOARD.GLOBAL_LIMIT(limit);

    const cached = await this.redis.getJson<LeaderboardUser[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
      },
      orderBy: {
        xp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streakDays: true,
      },
    });

    const rankings = users.map((user, index) => ({
      userId: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? undefined,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      rank: index + 1,
    }));

    await this.redis.setJson(cacheKey, rankings, CACHE_TTL.SHORT);
    return rankings;
  }

  async getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardUser[]> {
    const cacheKey = CACHE_KEYS.LEADERBOARD.WEEKLY_LIMIT(limit);

    const cached = await this.redis.getJson<LeaderboardUser[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const dailyStats = await this.prisma.userDailyStat.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        xpEarned: true,
      },
      orderBy: {
        _sum: {
          xpEarned: 'desc',
        },
      },
      take: limit,
    });

    const userIds = dailyStats.map((stat) => stat.userId);
    const weekXpMap = new Map(dailyStats.map((stat) => [stat.userId, stat._sum.xpEarned ?? 0]));

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streakDays: true,
      },
    });

    const rankings = users.map((user, index) => ({
      userId: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? undefined,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      rank: index + 1,
      weekXp: weekXpMap.get(user.id) ?? 0,
    }));

    await this.redis.setJson(cacheKey, rankings, CACHE_TTL.MEDIUM);
    return rankings;
  }

  async getMonthlyLeaderboard(limit: number = 100): Promise<LeaderboardUser[]> {
    const cacheKey = CACHE_KEYS.LEADERBOARD.MONTHLY_LIMIT(limit);

    const cached = await this.redis.getJson<LeaderboardUser[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const dailyStats = await this.prisma.userDailyStat.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: oneMonthAgo,
        },
      },
      _sum: {
        xpEarned: true,
      },
      orderBy: {
        _sum: {
          xpEarned: 'desc',
        },
      },
      take: limit,
    });

    const userIds = dailyStats.map((stat) => stat.userId);
    const monthXpMap = new Map(dailyStats.map((stat) => [stat.userId, stat._sum.xpEarned ?? 0]));

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streakDays: true,
      },
    });

    const rankings = users.map((user, index) => ({
      userId: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? undefined,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      rank: index + 1,
      monthXp: monthXpMap.get(user.id) ?? 0,
    }));

    await this.redis.setJson(cacheKey, rankings, CACHE_TTL.MEDIUM);
    return rankings;
  }

  async getUserRank(userId: string): Promise<{ rank: number; xp: number; level: number; totalUsers: number } | null> {
    const cacheKey = CACHE_KEYS.LEADERBOARD.USER(userId);

    const cached = await this.redis.getJson<{ rank: number; xp: number; level: number; totalUsers: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) {
      return null;
    }

    const higherRankedCount = await this.prisma.user.count({
      where: {
        xp: { gt: user.xp },
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    const result = {
      rank: higherRankedCount + 1,
      xp: user.xp,
      level: user.level,
      totalUsers,
    };

    await this.redis.setJson(cacheKey, result, CACHE_TTL.SHORT);
    return result;
  }

  async updateUserXp(userId: string, _xpToAdd: number): Promise<void> {
    await this.redis.del(CACHE_KEYS.LEADERBOARD.USER(userId));
    await this.redis.del(CACHE_KEYS.LEADERBOARD.GLOBAL_LIMIT(100));
    await this.redis.del(CACHE_KEYS.LEADERBOARD.WEEKLY_LIMIT(100));
    await this.redis.del(CACHE_KEYS.LEADERBOARD.MONTHLY_LIMIT(100));
  }
}
