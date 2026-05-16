import { Injectable, Logger } from '@nestjs/common';
import { LeaderboardRepository, LeaderboardUser } from '../repositories/leaderboard.repository';
import { LeaderboardPeriod, LeaderboardEntryDto, UserRankDto } from '../dto/leaderboard.dto';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly leaderboardRepository: LeaderboardRepository) {}

  async getLeaderboard(
    period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY,
    limit: number = 100,
  ): Promise<LeaderboardEntryDto[]> {
    this.logger.log(`Fetching ${period} leaderboard with limit ${limit}`);

    let rankings: LeaderboardUser[];

    switch (period) {
      case LeaderboardPeriod.DAILY:
        rankings = await this.leaderboardRepository.getGlobalLeaderboard(limit);
        break;
      case LeaderboardPeriod.WEEKLY:
        rankings = await this.leaderboardRepository.getWeeklyLeaderboard(limit);
        break;
      case LeaderboardPeriod.MONTHLY:
        rankings = await this.leaderboardRepository.getMonthlyLeaderboard(limit);
        break;
      case LeaderboardPeriod.ALL_TIME:
      default:
        rankings = await this.leaderboardRepository.getGlobalLeaderboard(limit);
        break;
    }

    return rankings;
  }

  async getUserRank(userId: string): Promise<UserRankDto | null> {
    this.logger.log(`Fetching rank for user ${userId}`);

    const rankData = await this.leaderboardRepository.getUserRank(userId);

    if (!rankData) {
      return null;
    }

    return {
      rank: rankData.rank,
      xp: rankData.xp,
      level: rankData.level,
      totalUsers: rankData.totalUsers,
    };
  }

  async getUserPosition(userId: string): Promise<LeaderboardEntryDto | null> {
    const rankData = await this.leaderboardRepository.getUserRank(userId);
    if (!rankData) {
      return null;
    }

    const leaderboard = await this.leaderboardRepository.getGlobalLeaderboard(
      Math.min(rankData.rank + 10, 100),
    );

    return leaderboard.find((entry) => entry.userId === userId) ?? null;
  }

  async addXpToUser(userId: string, xpToAdd: number): Promise<void> {
    this.logger.log(`Adding ${xpToAdd} XP to user ${userId}`);
    await this.leaderboardRepository.updateUserXp(userId, xpToAdd);
  }

  async getTopUsers(limit: number = 10): Promise<LeaderboardEntryDto[]> {
    return this.leaderboardRepository.getGlobalLeaderboard(limit);
  }
}
