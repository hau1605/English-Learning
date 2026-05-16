import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('speaking') private speakingQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async addJob(queueName: 'email' | 'notification' | 'speaking', data: Record<string, any>): Promise<void> {
    let queue: Queue;
    let jobPrefix: string;

    switch (queueName) {
      case 'email':
        queue = this.emailQueue;
        jobPrefix = 'email';
        break;
      case 'notification':
        queue = this.notificationQueue;
        jobPrefix = 'notification';
        break;
      case 'speaking':
        queue = this.speakingQueue;
        jobPrefix = 'speaking';
        break;
    }

    const job = await this.prisma.queueJob.create({
      data: {
        name: jobPrefix,
        data,
        status: 'PENDING',
      },
    });

    await queue.add(jobPrefix, { ...data, jobId: job.id });
    this.logger.log(`Job added to ${queueName} queue: ${jobPrefix}`);
  }

  async addEmailJob(name: string, data: any) {
    const job = await this.prisma.queueJob.create({
      data: {
        name: `email:${name}`,
        data,
        status: 'PENDING',
      },
    });

    await this.emailQueue.add(name, { ...data, jobId: job.id });

    this.logger.log(`Email job added: ${name}`);
  }

  async addNotificationJob(userId: string, notification: any) {
    const job = await this.prisma.queueJob.create({
      data: {
        name: 'notification:send',
        data: { userId, ...notification },
        status: 'PENDING',
      },
    });

    await this.notificationQueue.add('send', { userId, ...notification, jobId: job.id });

    this.logger.log(`Notification job added for user: ${userId}`);
  }

  async addSpeakingAnalysisJob(userId: string, attemptId: string, audioUrl: string) {
    const job = await this.prisma.queueJob.create({
      data: {
        name: 'speaking:analyze',
        data: { userId, attemptId, audioUrl },
        status: 'PENDING',
      },
    });

    await this.speakingQueue.add('analyze', { userId, attemptId, audioUrl, jobId: job.id });

    this.logger.log(`Speaking analysis job added: ${attemptId}`);
  }
}
