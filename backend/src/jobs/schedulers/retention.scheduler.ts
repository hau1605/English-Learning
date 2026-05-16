import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { MediaService } from "@/modules/media/services/media.service";

@Injectable()
export class RetentionScheduler {
  private readonly logger = new Logger(RetentionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runRetentionCleanup() {
    this.logger.log("Running retention cleanup...");

    const analyticsDays = this.config.get<number>("RETENTION_ANALYTICS_DAYS") || 180;
    const queueDays = this.config.get<number>("RETENTION_QUEUE_DAYS") || 30;
    const orphanMediaDays =
      this.config.get<number>("RETENTION_ORPHAN_MEDIA_DAYS") || 7;

    const [analytics, queue, media] = await Promise.all([
      this.deleteOldAnalyticsEvents(analyticsDays),
      this.deleteOldQueueJobs(queueDays),
      this.deleteOrphanMedia(orphanMediaDays),
    ]);

    this.logger.log(
      `Retention cleanup completed: analytics=${analytics}, queue=${queue}, media=${media}`,
    );
  }

  private async deleteOldAnalyticsEvents(days: number): Promise<number> {
    const cutoff = this.daysAgo(days);
    const result = await this.prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }

  private async deleteOldQueueJobs(days: number): Promise<number> {
    const cutoff = this.daysAgo(days);
    const result = await this.prisma.queueJob.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ["COMPLETED", "FAILED", "CANCELLED"] },
      },
    });
    return result.count;
  }

  private async deleteOrphanMedia(days: number): Promise<number> {
    const cutoff = this.daysAgo(days);
    const mediaFiles = await this.prisma.mediaFile.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { fileKey: true, fileUrl: true },
      take: 500,
    });

    let deleted = 0;
    for (const media of mediaFiles) {
      if (await this.isMediaReferenced(media.fileKey, media.fileUrl)) {
        continue;
      }

      try {
        await this.mediaService.deleteFile(media.fileKey);
        deleted += 1;
      } catch (error) {
        this.logger.warn(`Failed to delete orphan media ${media.fileKey}: ${error}`);
      }
    }

    return deleted;
  }

  private async isMediaReferenced(fileKey: string, fileUrl: string): Promise<boolean> {
    const values = Array.from(new Set([fileKey, fileUrl]));

    const [
      courseCount,
      lessonCount,
      vocabularyCount,
      flashcardCount,
      speakingCount,
    ] = await Promise.all([
      this.prisma.course.count({ where: { thumbnail: { in: values } } }),
      this.prisma.lesson.count({ where: { videoUrl: { in: values } } }),
      this.prisma.vocabulary.count({
        where: {
          OR: [{ audioUrl: { in: values } }, { imageUrl: { in: values } }],
        },
      }),
      this.prisma.flashcard.count({
        where: {
          OR: [{ audioUrl: { in: values } }, { imageUrl: { in: values } }],
        },
      }),
      this.prisma.userSpeakingAttempt.count({
        where: { audioUrl: { in: values } },
      }),
    ]);

    return (
      courseCount +
        lessonCount +
        vocabularyCount +
        flashcardCount +
        speakingCount >
      0
    );
  }

  private daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}
