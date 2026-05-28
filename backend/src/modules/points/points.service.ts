import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LeaderboardRepository } from "@/modules/leaderboard/repositories/leaderboard.repository";
import { EventService } from "@/modules/events/services/event.service";
import type { Prisma } from "@prisma/client";
import { RedisService } from "@/common/redis/redis.service";
import { CACHE_KEYS } from "@/common/constants/cache-keys";
import { getTotalXpForLevel } from "@/modules/progress/constants/achievements";

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardRepo: LeaderboardRepository,
    private readonly eventService: EventService,
    private readonly redis: RedisService,
  ) {}

  async awardXp(userId: string, xp: number, source: string = "system") {
    if (!xp || xp <= 0) return;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xp }, lastStudyAt: new Date() },
      select: { xp: true, level: true },
    });

    const nextLevel = this.calculateLevel(user.xp);
    if (nextLevel > user.level) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: nextLevel },
      });
    }

    try {
      await this.leaderboardRepo.updateUserXp(userId, xp);
    } catch (err) {
      this.logger.warn(
        `Failed to update leaderboard for user ${userId}: ${err}`,
      );
    }

    await this.invalidateProgressCache(userId);

    try {
      this.eventService.emitXpUpdated(userId, xp, source);
    } catch (err) {
      this.logger.warn(`Failed to emit xp update event: ${err}`);
    }
  }

  async awardXpWithinTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    xp: number,
  ): Promise<void> {
    if (!xp || xp <= 0) return;

    await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xp },
        lastStudyAt: new Date(),
      },
    });
  }

  async finalizeXpAward(
    userId: string,
    xp: number,
    source: string = "system",
  ): Promise<void> {
    if (!xp || xp <= 0) return;

    try {
      await this.leaderboardRepo.updateUserXp(userId, xp);
    } catch (err) {
      this.logger.warn(
        `Failed to update leaderboard for user ${userId}: ${err}`,
      );
    }

    await this.invalidateProgressCache(userId);

    try {
      this.eventService.emitXpUpdated(userId, xp, source);
    } catch (err) {
      this.logger.warn(`Failed to emit xp update event: ${err}`);
    }
  }

  private async invalidateProgressCache(userId: string): Promise<void> {
    try {
      await this.redis.del(CACHE_KEYS.PROGRESS.USER(userId));
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate progress cache for user ${userId}: ${err}`,
      );
    }
  }

  private calculateLevel(totalXp: number): number {
    let level = 1;
    while (getTotalXpForLevel(level + 1) <= totalXp) {
      level += 1;
    }
    return level;
  }
}

export default PointsService;
