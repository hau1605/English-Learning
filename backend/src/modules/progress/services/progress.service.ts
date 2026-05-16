import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/common/redis/redis.service";
import { CACHE_TTL } from "@/common/constants/cache-keys";
import { EventService } from "@/modules/events/services/event.service";
import { NotificationsService } from "@/modules/notifications/services/notifications.service";
import { EmailService } from "@/modules/email/services/email.service";
import { PointsService } from "@/modules/points/points.service";
import {
  ACHIEVEMENTS,
  getXpForLevel,
  getTotalXpForLevel,
} from "../constants/achievements";

export interface UserProgress {
  userId: string;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  streakDays: number;
  longestStreak: number;
  totalWordsLearned: number;
  totalFlashcardsReviewed: number;
  totalQuizzesCompleted: number;
  totalSpeakingMinutes: number;
  averageAccuracy: number;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventService: EventService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly pointsService: PointsService,
  ) {}

  async getUserProgress(userId: string): Promise<UserProgress> {
    const cacheKey = `progress:${userId}`;
    const cached = await this.redis.getJson<UserProgress>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        streakDays: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const [flashcardStats, quizStats, speakingStats] = await Promise.all([
      this.prisma.userFlashcardReview.aggregate({
        where: { userId },
        _sum: { totalReviews: true },
      }),
      this.prisma.userQuizAttempt.aggregate({
        where: { userId },
        _count: true,
      }),
      this.prisma.userSpeakingAttempt.aggregate({
        where: { userId },
        _count: true,
      }),
    ]);

    const totalXp = user.xp;
    const currentLevelXp = getTotalXpForLevel(user.level);
    const nextLevelXp = getTotalXpForLevel(user.level + 1);
    const xpProgress = totalXp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;

    // compute totals from daily stats
    const dailyAgg = await this.prisma.userDailyStat.aggregate({
      where: { userId },
      _sum: {
        learnedWords: true,
        speakingMinutes: true,
        studyMinutes: true,
        xpEarned: true,
        flashcardsReviewed: true,
        quizzesCompleted: true,
      },
    });

    // compute average accuracy from quiz attempts
    const attempts = await this.prisma.userQuizAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { totalCorrect: true, totalQuestions: true },
    });

    let averageAccuracy = 0;
    if (attempts.length > 0) {
      const accSum = attempts.reduce((sum, a) => {
        if (!a.totalQuestions || a.totalQuestions === 0) return sum;
        return sum + a.totalCorrect / a.totalQuestions;
      }, 0);
      averageAccuracy =
        Math.round((accSum / attempts.length) * 100 * 100) / 100; // percent rounded to 2 decimals
    }

    // compute longest streak from daily stats (consecutive days with activity)
    const days = await this.prisma.userDailyStat.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: "asc" },
    });
    let longestStreak = 0;
    if (days.length > 0) {
      let currentStreak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1].date);
        const curr = new Date(days[i].date);
        const diffDays = Math.floor((+curr - +prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          currentStreak = 1;
        }
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    }

    const progress: UserProgress = {
      userId,
      totalXp,
      level: user.level,
      xpToNextLevel: Math.max(0, nextLevelXp - totalXp),
      streakDays: user.streakDays,
      longestStreak,
      totalWordsLearned: (dailyAgg._sum.learnedWords as number) || 0,
      totalFlashcardsReviewed:
        (dailyAgg._sum.flashcardsReviewed as number) ||
        flashcardStats._sum.totalReviews ||
        0,
      totalQuizzesCompleted:
        (dailyAgg._sum.quizzesCompleted as number) || quizStats._count,
      totalSpeakingMinutes: (dailyAgg._sum.speakingMinutes as number) || 0,
      averageAccuracy,
    };

    await this.redis.setJson(cacheKey, progress, CACHE_TTL.MEDIUM);
    return progress;
  }

  async getDailyProgress(userId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await this.prisma.userDailyStat.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return (
      stats || {
        date: startOfDay,
        xpEarned: 0,
        wordsLearned: 0,
        flashcardsReviewed: 0,
        quizzesCompleted: 0,
        studyMinutes: 0,
        streakContinued: false,
      }
    );
  }

  async getWeeklyProgress(userId: string): Promise<any> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const stats = await this.prisma.userDailyStat.findMany({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: now,
        },
      },
    });

    return {
      week: `W${Math.ceil((now.getDate() - now.getDay() + 1) / 7)}`,
      totalXp: stats.reduce((sum, s) => sum + s.xpEarned, 0),
      totalStudyMinutes: stats.reduce((sum, s) => sum + s.studyMinutes, 0),
      totalFlashcardsReviewed: stats.reduce(
        (sum, s) => sum + s.flashcardsReviewed,
        0,
      ),
      totalQuizzesCompleted: stats.reduce(
        (sum, s) => sum + s.quizzesCompleted,
        0,
      ),
      activeDays: stats.length,
    };
  }

  async checkAndAwardAchievements(userId: string): Promise<any[]> {
    const userProgress = await this.getUserProgress(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, streakDays: true },
    });

    const newAchievements: any[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const existing = await this.prisma.userNotification.findFirst({
        where: {
          userId,
          notification: {
            title: achievement.name,
          },
        },
      });

      if (existing) continue;

      let achievementProgress = 0;
      let isUnlocked = false;

      switch (achievement.type) {
        case "streak":
          achievementProgress = user?.streakDays || 0;
          isUnlocked = achievementProgress >= achievement.requirement;
          break;
        case "flashcards":
          achievementProgress = userProgress.totalFlashcardsReviewed;
          isUnlocked = achievementProgress >= achievement.requirement;
          break;
        case "quizzes":
          achievementProgress = userProgress.totalQuizzesCompleted;
          isUnlocked = achievementProgress >= achievement.requirement;
          break;
        case "xp":
          achievementProgress = user?.xp || 0;
          isUnlocked = achievementProgress >= achievement.requirement;
          break;
        case "level":
          achievementProgress = user?.level || 0;
          isUnlocked = achievementProgress >= achievement.requirement;
          break;
      }

      if (isUnlocked) {
        await this.awardAchievement(userId, achievement);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  private async awardAchievement(
    userId: string,
    achievement: any,
  ): Promise<void> {
    // Award XP via PointsService
    await this.pointsService.awardXp(
      userId,
      achievement.xpReward,
      "achievement",
    );

    // Create notification
    await this.notificationsService.create({
      userId,
      type: "ACHIEVEMENT" as any,
      title: `Achievement Unlocked: ${achievement.name}`,
      message: `${achievement.description}. You earned ${achievement.xpReward} XP!`,
      data: {
        achievementId: achievement.id,
        xpReward: achievement.xpReward,
      },
    });

    // Emit event
    this.eventService.emitXpUpdated(
      userId,
      achievement.xpReward,
      "achievement",
    );

    this.logger.log(
      `Achievement awarded to user ${userId}: ${achievement.name}`,
    );
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, streakDays: true },
    });

    if (!user) {
      return [];
    }

    const progress = await this.getUserProgress(userId);
    const achievements = [];

    for (const def of ACHIEVEMENTS) {
      let currentProgress = 0;
      let requirementMet = 0;

      switch (def.type) {
        case "streak":
          currentProgress = user.streakDays;
          requirementMet = user.streakDays >= def.requirement ? 1 : 0;
          break;
        case "flashcards":
          currentProgress = progress.totalFlashcardsReviewed;
          requirementMet =
            progress.totalFlashcardsReviewed >= def.requirement ? 1 : 0;
          break;
        case "quizzes":
          currentProgress = progress.totalQuizzesCompleted;
          requirementMet =
            progress.totalQuizzesCompleted >= def.requirement ? 1 : 0;
          break;
        case "xp":
          currentProgress = user.xp;
          requirementMet = user.xp >= def.requirement ? 1 : 0;
          break;
        case "level":
          currentProgress = user.level;
          requirementMet = user.level >= def.requirement ? 1 : 0;
          break;
      }

      achievements.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
        requirement: def.requirement,
        type: def.type,
        isUnlocked: requirementMet === 1,
        progress: Math.min(
          100,
          Math.round((currentProgress / def.requirement) * 100),
        ),
      });
    }

    return achievements;
  }
}
