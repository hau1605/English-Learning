import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { EventName } from "@/common/enums";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Processor("email")
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
    const host = this.config.get<string>("SMTP_HOST");
    const port = this.config.get<number>("SMTP_PORT") || 587;
    const user =
      this.config.get<string>("SMTP_USER") ||
      this.config.get<string>("SMTP_USERNAME");
    const pass =
      this.config.get<string>("SMTP_PASS") ||
      this.config.get<string>("SMTP_PASSWORD");

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn(
        "SMTP not configured - emails will be logged instead of sent",
      );
    }
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case "send":
        return this.handleSendEmail(job);
      case "welcome":
        return this.handleWelcomeEmail(job);
      case "password-reset":
      case "password_reset":
        return this.handlePasswordResetEmail(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendEmail(job: Job<any>) {
    this.logger.log(`Processing email job: ${job.id}`);

    const { to, subject, template, data } = job.data;

    this.logger.log(`Sending email to: ${to}, subject: ${subject}`);

    const queueJobId = job.data.jobId || job.id;

    try {
      await this.markQueueJobProcessing(queueJobId);
      if (this.transporter) {
        await this.transporter.sendMail({
          to,
          subject,
          html: template || data?.html,
          from: data?.from,
        });
        this.logger.log(`Email sent via SMTP to ${to}`);
      } else {
        this.logger.log("SMTP disabled — logging email instead of sending");
        this.logger.debug({ to, subject, template, data });
      }

      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          result: { sent: true },
        },
      });

      return { success: true, to, subject };
    } catch (err) {
      this.logger.error(`Failed to send email: ${err}`);
      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          error: String(err),
        },
      });
      throw err;
    }
  }

  private async handleWelcomeEmail(job: Job<any>) {
    this.logger.log(`Processing welcome email job: ${job.id}`);

    const { userId, email, fullName } = job.data;

    const html = `Welcome ${fullName} to our platform!`;
    const queueJobId = job.data.jobId || job.id;

    try {
      await this.markQueueJobProcessing(queueJobId);
      if (this.transporter) {
        await this.transporter.sendMail({
          to: email,
          subject: "Welcome!",
          html,
          from: undefined,
        });
      } else {
        this.logger.log("SMTP disabled — logging welcome email");
        this.logger.debug({ userId, email, fullName });
      }

      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          result: { sent: true },
        },
      });

      return { success: true };
    } catch (err) {
      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: { status: "FAILED", processedAt: new Date(), error: String(err) },
      });
      throw err;
    }
  }

  private async handlePasswordResetEmail(job: Job<any>) {
    this.logger.log(`Processing password reset email job: ${job.id}`);

    const { email, resetUrl } = job.data;

    const html = `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`;
    const queueJobId = job.data.jobId || job.id;

    try {
      await this.markQueueJobProcessing(queueJobId);
      if (this.transporter) {
        await this.transporter.sendMail({
          to: email,
          subject: "Password reset",
          html,
          from: undefined,
        });
      } else {
        this.logger.log("SMTP disabled — logging password reset email");
        this.logger.debug({ email, resetUrl });
      }

      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          result: { sent: true },
        },
      });

      return { success: true };
    } catch (err) {
      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: { status: "FAILED", processedAt: new Date(), error: String(err) },
      });
      throw err;
    }
  }

  private async markQueueJobProcessing(queueJobId: string | number) {
    await this.prisma.queueJob.update({
      where: { id: String(queueJobId) },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });
  }
}

@Processor("notification")
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    return this.handleSendNotification(job);
  }

  private async handleSendNotification(job: Job<any>) {
    this.logger.log(`Processing notification job: ${job.id}`);

    const { userId, type, title, content, data } = job.data;
    const queueJobId = job.data.jobId || job.id;

    this.logger.log(`Notification for user ${userId}: ${title}`);

    await this.prisma.queueJob.update({
      where: { id: String(queueJobId) },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    const notificationId = String(job.id || crypto.randomUUID());

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.notification.upsert({
          where: { id: notificationId },
          create: {
            id: notificationId,
            type,
            title,
            content,
            data,
          },
          update: {},
        });

        await tx.userNotification.create({
          data: {
            userId,
            notificationId,
          },
        });

        await tx.queueJob.update({
          where: { id: String(queueJobId) },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            result: { sent: true },
          },
        });
      });

      return { success: true };
    } catch (err) {
      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          error: String(err),
        },
      });
      throw err;
    }
  }
}

@Processor("speaking")
export class SpeakingProcessor extends WorkerHost {
  private readonly logger = new Logger(SpeakingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    return this.handleSpeakingAnalysis(job);
  }

  private async handleSpeakingAnalysis(job: Job<any>) {
    this.logger.log(`Processing speaking analysis job: ${job.id}`);

    const { attemptId, audioUrl } = job.data;
    const queueJobId = job.data.jobId || job.id;

    await this.prisma.queueJob.update({
      where: { id: String(queueJobId) },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    await this.prisma.userSpeakingAttempt.update({
      where: { id: attemptId },
      data: { processingStatus: "PROCESSING" },
    });

    try {
      const result = {
        transcript: null,
        pronunciationScore: null,
        fluencyScore: null,
        accuracyScore: null,
        overallScore: null,
        feedback:
          "Recording saved successfully. Automated pronunciation scoring is disabled in this build.",
      };

      await this.prisma.userSpeakingAttempt.update({
        where: { id: attemptId },
        data: {
          ...result,
          processingStatus: "COMPLETED",
        },
      });

      await this.prisma.analyticsEvent.create({
        data: {
          userId: job.data.userId,
          eventName: EventName.SPEAKING_COMPLETED,
          metadata: {
            attemptId,
            audioUrl,
          },
        },
      });

      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          result: { saved: true },
        },
      });

      return { success: true, result };
    } catch (error) {
      await this.prisma.userSpeakingAttempt.update({
        where: { id: attemptId },
        data: { processingStatus: "FAILED" },
      });

      await this.prisma.queueJob.update({
        where: { id: String(queueJobId) },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          error: String(error),
        },
      });

      throw error;
    }
  }
}
