import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_TTL } from '@/common/constants/cache-keys';

@Injectable()
export class LeaderboardScheduler {
  private readonly logger = new Logger(LeaderboardScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

  // Update leaderboard cache every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateLeaderboardCache() {
    this.logger.log('Updating leaderboard cache...');

    try {
      const leaderboard = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
        orderBy: {
          xp: 'desc',
        },
        take: 100,
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          xp: true,
          level: true,
          streakDays: true,
        },
      });

      const rankings = leaderboard.map((user: any, index: number) => ({
        userId: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays,
        rank: index + 1,
      }));

      // Update Redis cache
      await this.redis.setJson(
        'leaderboard:global',
        rankings,
        CACHE_TTL.SHORT,
      );

      this.logger.log(`Leaderboard cache updated with ${rankings.length} users`);
    } catch (error) {
      this.logger.error('Error updating leaderboard cache:', error);
    }
  }

  // Broadcast leaderboard updates every 15 minutes
  @Cron('*/15 * * * *')
  async broadcastLeaderboardUpdate() {
    this.logger.log('Broadcasting leaderboard update...');

    try {
      const rankings = await this.redis.getJson('leaderboard:global');

      if (rankings) {
        this.eventEmitter.emit('leaderboard.updated', {
          rankings,
        });
        this.logger.log('Leaderboard update broadcasted');
      }
    } catch (error) {
      this.logger.error('Error broadcasting leaderboard update:', error);
    }
  }

  // Weekly leaderboard reset check (every Sunday at midnight)
  @Cron('0 0 * * 0')
  async handleWeeklyLeaderboard() {
    this.logger.log('Checking weekly leaderboard...');

    try {
      // Get top 10 users of the week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const topUsers = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
        orderBy: {
          xp: 'desc',
        },
        take: 10,
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          xp: true,
        },
      });

      // Emit weekly leaderboard event
      this.eventEmitter.emit('leaderboard.weekly', {
        topUsers,
        weekEndDate: new Date(),
      });

      this.logger.log(
        `Weekly leaderboard processed with ${topUsers.length} top users`,
      );
    } catch (error) {
      this.logger.error('Error processing weekly leaderboard:', error);
    }
  }

  // Monthly leaderboard check (first day of month)
  @Cron('0 0 1 * *')
  async handleMonthlyLeaderboard() {
    this.logger.log('Processing monthly leaderboard...');

    try {
      // Get top users for the month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const topUsers = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
        orderBy: {
          xp: 'desc',
        },
        take: 50,
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          xp: true,
          level: true,
        },
      });

      // Emit monthly leaderboard event
      this.eventEmitter.emit('leaderboard.monthly', {
        topUsers,
        month: new Date().toISOString().slice(0, 7),
      });

      this.logger.log(
        `Monthly leaderboard processed with ${topUsers.length} top users`,
      );
    } catch (error) {
      this.logger.error('Error processing monthly leaderboard:', error);
    }
  }
}
