import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RolesService } from '@/modules/permissions/services/roles.service';
import { RedisService } from '@/common/redis/redis.service';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly redis: RedisService,
  ) {}

  // ========== DASHBOARD ==========

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalFlashcards,
      totalQuizzes,
      totalVocabulary,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.flashcard.count(),
      this.prisma.quiz.count(),
      this.prisma.vocabulary.count(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalFlashcards,
      totalQuizzes,
      totalVocabulary,
    };
  }

  async getRecentActivity(limit: number = 20) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // ========== USER MANAGEMENT ==========

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          level: true,
          xp: true,
          streakDays: true,
          status: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: { code: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((user) => ({
      ...user,
      roleCodes: user.userRoles.map((ur) => ur.role.code),
    }));

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

  async assignRole(userId: string, roleCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return this.rolesService.assignRoleToUser(userId, role.id);
  }

  async removeRole(userId: string, roleCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return this.rolesService.removeRoleFromUser(userId, role.id);
  }

  async suspendUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  // ========== REPORTS ==========

  async getUserEngagementReport(params: {
    startDate?: string;
    endDate?: string;
  }) {
    const { startDate, endDate } = params;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [dailyStats, totalStats] = await Promise.all([
      this.prisma.userDailyStat.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.userDailyStat.aggregate({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          learnedWords: true,
          flashcardsReviewed: true,
          quizzesCompleted: true,
          studyMinutes: true,
          xpEarned: true,
        },
        _avg: {
          learnedWords: true,
          flashcardsReviewed: true,
          quizzesCompleted: true,
        },
      }),
    ]);

    const uniqueUsers = await this.prisma.userDailyStat.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      dailyStats,
      totals: totalStats._sum,
      averages: totalStats._avg,
      activeUsers: uniqueUsers.length,
    };
  }

  async getQuizPerformanceReport(params: {
    startDate?: string;
    endDate?: string;
  }) {
    const { startDate, endDate } = params;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [attempts, quizStats] = await Promise.all([
      this.prisma.userQuizAttempt.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          quiz: {
            select: { title: true, type: true, passingScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userQuizAttempt.groupBy({
        by: ['quizId'],
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _count: true,
        _avg: {
          score: true,
        },
      }),
    ]);

    const quizDetails = await Promise.all(
      quizStats.map(async (stat) => {
        const quiz = await this.prisma.quiz.findUnique({
          where: { id: stat.quizId },
          select: { title: true, type: true, passingScore: true },
        });
        return {
          ...stat,
          quiz,
        };
      })
    );

    const overallStats = {
      totalAttempts: attempts.length,
      averageScore: attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
        : 0,
      passRate: attempts.length > 0
        ? (attempts.filter((a) => a.score >= (a.quiz?.passingScore || 70)).length / attempts.length) * 100
        : 0,
    };

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      overallStats,
      quizStats: quizDetails,
      recentAttempts: attempts.slice(0, 50),
    };
  }

  async getLearningProgressReport() {
    const [users, vocabularyStats, flashcardStats] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          fullName: true,
          level: true,
          xp: true,
          streakDays: true,
          createdAt: true,
          _count: {
            select: {
              quizAttempts: true,
              flashcardReviews: true,
            },
          },
        },
        orderBy: { xp: 'desc' },
        take: 100,
      }),
      this.prisma.vocabulary.groupBy({
        by: ['difficulty'],
        _count: true,
      }),
      this.prisma.userFlashcardReview.groupBy({
        by: ['userId'],
        _count: true,
      }),
    ]);

    const userProgress = users.map((user) => ({
      ...user,
      totalReviews: user._count.flashcardReviews,
      totalQuizAttempts: user._count.quizAttempts,
    }));

    return {
      totalUsers: users.length,
      vocabularyByDifficulty: vocabularyStats,
      flashcardEngagement: {
        totalReviewers: flashcardStats.length,
        averageCardsPerUser: flashcardStats.length > 0
          ? flashcardStats.reduce((sum, s) => sum + s._count, 0) / flashcardStats.length
          : 0,
      },
      topUsers: userProgress.slice(0, 20),
    };
  }

  async exportUserData() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        level: true,
        xp: true,
        streakDays: true,
        status: true,
        createdAt: true,
        lastStudyAt: true,
        _count: {
          select: {
            quizAttempts: true,
            flashcardReviews: true,
            dailyStats: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      totalQuizzes: user._count.quizAttempts,
      totalFlashcardReviews: user._count.flashcardReviews,
      totalStudyDays: user._count.dailyStats,
    }));
  }

  // ========== SETTINGS ==========

  async getSystemSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, any> = {};
    
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch {
        result[setting.key] = setting.value;
      }
    }
    
    return result;
  }

  async updateSystemSetting(key: string, value: any) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: stringValue },
      update: { value: stringValue },
    });
  }

  // ========== ANALYTICS DASHBOARD ==========

  async getAnalyticsOverview() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      weeklyDAU,
      monthlyDAU,
      weeklyStats,
      monthlyStats,
      totalVocabulary,
      totalFlashcards,
    ] = await Promise.all([
      this.prisma.userDailyStat.groupBy({
        by: ['userId'],
        where: {
          date: { gte: weekAgo },
        },
      }),
      this.prisma.userDailyStat.groupBy({
        by: ['userId'],
        where: {
          date: { gte: monthAgo },
        },
      }),
      this.prisma.userDailyStat.aggregate({
        where: { date: { gte: weekAgo } },
        _sum: {
          learnedWords: true,
          flashcardsReviewed: true,
          quizzesCompleted: true,
          studyMinutes: true,
          xpEarned: true,
        },
      }),
      this.prisma.userDailyStat.aggregate({
        where: { date: { gte: monthAgo } },
        _sum: {
          learnedWords: true,
          flashcardsReviewed: true,
          quizzesCompleted: true,
          studyMinutes: true,
          xpEarned: true,
        },
      }),
      this.prisma.vocabulary.count(),
      this.prisma.flashcard.count(),
    ]);

    return {
      dailyActiveUsers: {
        weekly: weeklyDAU.length,
        monthly: monthlyDAU.length,
      },
      weeklyActivity: weeklyStats._sum,
      monthlyActivity: monthlyStats._sum,
      contentStats: {
        totalVocabulary,
        totalFlashcards,
      },
    };
  }
}
