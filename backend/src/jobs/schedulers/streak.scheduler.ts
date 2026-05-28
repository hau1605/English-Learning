import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_KEYS } from '@/common/constants/cache-keys';
import { RedisService } from '@/common/redis/redis.service';

@Injectable()
export class StreakScheduler {
  private readonly logger = new Logger(StreakScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  // Run every day at midnight to check and reset streaks
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkDailyStreaks() {
    this.logger.log('Running daily streak check...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who didn't learn yesterday but had an active streak
      const usersWithStreaks = await this.prisma.user.findMany({
        where: {
          streakDays: { gt: 0 },
          deletedAt: null,
        },
      });

      for (const user of usersWithStreaks) {
        // Check if user had any activity yesterday
        const yesterdayActivity = await this.getUserActivityForDate(
          user.id,
          yesterday,
        );

        if (!yesterdayActivity) {
          // Reset streak
          await this.prisma.user.update({
            where: { id: user.id },
            data: { streakDays: 0 },
          });

          this.eventEmitter.emit('streak.reset', {
            userId: user.id,
            previousStreak: user.streakDays,
          });

          this.logger.log(
            `Reset streak for user ${user.id} (was ${user.streakDays} days)`,
          );
        }
      }

      this.logger.log('Daily streak check completed');
    } catch (error) {
      this.logger.error('Error in daily streak check:', error);
    }
  }

  // Check and update streaks every hour
  @Cron(CronExpression.EVERY_HOUR)
  async updateHourlyStreaks() {
    this.logger.log('Running hourly streak check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who learned today but haven't had their streak updated
      const todayLearners = await this.getTodayLearners();

      for (const userId of todayLearners) {
        const cacheKey = CACHE_KEYS.STREAK.UPDATED(userId, today.toISOString().split('T')[0]);
        const alreadyUpdated = await this.redis.get(cacheKey);

        if (!alreadyUpdated) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            const newStreak = user.streakDays + 1;
            await this.prisma.user.update({
              where: { id: userId },
              data: { streakDays: newStreak },
            });

            await this.redis.setex(cacheKey, 86400, '1'); // Expire in 24 hours

            this.eventEmitter.emit('streak.updated', {
              userId,
              streakDays: newStreak,
              previousStreak: user.streakDays,
            });

            this.logger.log(
              `Updated streak for user ${userId} to ${newStreak} days`,
            );
          }
        }
      }

      this.logger.log('Hourly streak check completed');
    } catch (error) {
      this.logger.error('Error in hourly streak check:', error);
    }
  }

  private async getUserActivityForDate(
    userId: string,
    date: Date,
  ): Promise<boolean> {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check for any learning activity on this date
    const quizActivity = await this.prisma.userQuizAttempt.findFirst({
      where: {
        userId,
        createdAt: {
          gte: date,
          lt: nextDay,
        },
      },
    });

    if (quizActivity) return true;

    const flashcardActivity =
      await this.prisma.userFlashcardReview.findFirst({
        where: {
          userId,
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });

    if (flashcardActivity) return true;

    const speakingActivity = await this.prisma.userSpeakingAttempt.findFirst({
      where: {
        userId,
        createdAt: {
          gte: date,
          lt: nextDay,
        },
      },
    });

    return !!speakingActivity;
  }

  private async getTodayLearners(): Promise<string[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const userIds = new Set<string>();

    // Get users who did quizzes today
    const quizUsers = await this.prisma.userQuizAttempt.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: nextDay,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    quizUsers.forEach((u: any) => userIds.add(u.userId));

    // Get users who reviewed flashcards today
    const flashcardUsers = await this.prisma.userFlashcardReview.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: nextDay,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    flashcardUsers.forEach((u: any) => userIds.add(u.userId));

    // Get users who did speaking practice today
    const speakingUsers = await this.prisma.userSpeakingAttempt.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: nextDay,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    speakingUsers.forEach((u: { userId: string }) => userIds.add(u.userId));

    return Array.from(userIds);
  }
}
