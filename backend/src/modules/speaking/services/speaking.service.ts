import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { QueueService } from "@/queues/queue.service";
import { EventService } from "@/modules/events/services/event.service";
import { PointsService } from "@/modules/points/points.service";

export interface SpeakingAnalysisResult {
  transcript: string;
  pronunciationScore: number;
  fluencyScore: number;
  accuracyScore: number;
  overallScore: number;
  feedback: string;
  suggestions: string[];
}

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly eventService: EventService,
    private readonly pointsService: PointsService,
  ) {}

  async getExercises(params: {
    lessonId?: string;
    limit?: number;
    difficulty?: number;
  }) {
    const where: any = {};
    if (params.lessonId) {
      where.lessonId = params.lessonId;
    }
    if (params.difficulty) {
      where.difficulty = params.difficulty;
    }

    return this.prisma.speakingExercise.findMany({
      where,
      take: params.limit || 20,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });
  }

  async getExerciseById(id: string) {
    const exercise = await this.prisma.speakingExercise.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException("Speaking exercise not found");
    }

    return exercise;
  }

  async createExercise(data: {
    lessonId?: string;
    title: string;
    textContent: string;
    expectedPronunciation?: string;
    difficulty?: number;
    audioUrl?: string;
  }) {
    return this.prisma.speakingExercise.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        textContent: data.textContent,
        expectedPronunciation: data.expectedPronunciation,
        difficulty: data.difficulty || 1,
        audioUrl: data.audioUrl,
      },
    });
  }

  async submitAttempt(
    userId: string,
    exerciseId: string,
    audioUrl: string,
  ): Promise<{
    attemptId: string;
    status: string;
  }> {
    const exercise = await this.prisma.speakingExercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException("Speaking exercise not found");
    }

    const attempt = await this.prisma.userSpeakingAttempt.create({
      data: {
        userId,
        speakingExerciseId: exerciseId,
        audioUrl,
        processingStatus: "PENDING",
      },
    });

    await this.queueService.addSpeakingAnalysisJob(
      userId,
      attempt.id,
      audioUrl,
    );

    this.logger.log(`Speaking attempt created: ${attempt.id}`);

    return {
      attemptId: attempt.id,
      status: "PENDING",
    };
  }

  async getAttemptResult(attemptId: string) {
    const attempt = await this.prisma.userSpeakingAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            textContent: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    return attempt;
  }

  async processAttempt(attemptId: string): Promise<SpeakingAnalysisResult> {
    const attempt = await this.prisma.userSpeakingAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exercise: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    // Update status to processing
    await this.prisma.userSpeakingAttempt.update({
      where: { id: attemptId },
      data: { processingStatus: "PROCESSING" },
    });

    try {
      const wordCount = attempt.exercise.textContent
        .split(/\s+/)
        .filter(Boolean).length;
      const overallScore = Math.max(50, Math.min(100, 70 + wordCount));
      const feedback =
        "Recording saved successfully. Automated pronunciation scoring is disabled in this build.";

      await this.prisma.userSpeakingAttempt.update({
        where: { id: attemptId },
        data: {
          transcript: null,
          pronunciationScore: null,
          fluencyScore: null,
          accuracyScore: null,
          overallScore,
          feedback,
          processingStatus: "COMPLETED",
        },
      });

      const xpEarned = Math.max(5, Math.round(wordCount / 2));

      if (xpEarned > 0) {
        await this.pointsService.awardXp(attempt.userId, xpEarned, "speaking");

        this.eventService.emitSpeakingCompleted(
          attempt.userId,
          attemptId,
          overallScore,
          xpEarned,
        );
      }

      this.logger.log(
        `Speaking attempt processed: ${attemptId}, Score: ${overallScore}`,
      );

      return {
        transcript: "",
        pronunciationScore: 0,
        fluencyScore: 0,
        accuracyScore: 0,
        overallScore,
        feedback,
        suggestions: [
          "Listen back to your recording and compare it with the prompt.",
        ],
      };
    } catch (error) {
      this.logger.error(
        `Error processing speaking attempt: ${attemptId}`,
        error,
      );

      await this.prisma.userSpeakingAttempt.update({
        where: { id: attemptId },
        data: { processingStatus: "FAILED" },
      });

      throw error;
    }
  }

  async getAttempts(userId: string, params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.userSpeakingAttempt.findMany({
        where: { userId },
        include: {
          exercise: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.userSpeakingAttempt.count({ where: { userId } }),
    ]);

    return {
      data: attempts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async getAttemptStats(userId: string) {
    const stats = await this.prisma.userSpeakingAttempt.aggregate({
      where: { userId, processingStatus: "COMPLETED" },
      _avg: {
        pronunciationScore: true,
        fluencyScore: true,
        accuracyScore: true,
        overallScore: true,
      },
      _count: true,
    });

    return {
      totalAttempts: stats._count,
      averagePronunciation: Math.round(stats._avg.pronunciationScore || 0),
      averageFluency: Math.round(stats._avg.fluencyScore || 0),
      averageAccuracy: Math.round(stats._avg.accuracyScore || 0),
      averageOverall: Math.round(stats._avg.overallScore || 0),
    };
  }
}
