# Cron Jobs & Scheduled Tasks - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết hệ thống cron jobs và scheduled tasks cho background processing.

---

# 1. Overview

# 1.1 Why Scheduled Jobs?

Use cases:

- **Daily Reports**: Generate daily summaries
- **Cleanup**: Remove expired data
- **Aggregation**: Calculate statistics
- **Leaderboard**: Update rankings
- **Notifications**: Send reminders
- **Sync**: External system synchronization
- **Maintenance**: Database optimization

---

# 1.2 Job Types

| Type | Frequency | Examples |
|------|-----------|----------|
| Real-time | Milliseconds | API responses |
| Background | Seconds - Minutes | Email sending |
| Scheduled | Minutes - Hours | Leaderboard updates |
| Daily | Once per day | Reports, cleanup |
| Weekly | Once per week | Email digests |
| Monthly | Once per month | Archiving |

---

# 2. Job Architecture

# 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Application                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Scheduled Jobs  │    │   Queue Jobs     │                  │
│  │  (@Cron)         │    │   (BullMQ)       │                  │
│  └────────┬─────────┘    └────────┬─────────┘                  │
│           │                      │                              │
│  ┌────────▼──────────────────────▼─────────┐                  │
│  │              Job Runner                    │                  │
│  │         (Bull + Scheduler)                │                  │
│  └────────────────────┬─────────────────────┘                  │
│                       │                                        │
└───────────────────────┼───────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                      Redis                                      │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                   Database                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. BullMQ Implementation

# 3.1 Queue Setup

```typescript
// queues/queues.module.ts
import { BullModule } from '@nestjs/bullmq';
import { Connection } from 'bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: new Connection({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        }),
      }),
    }),

    // Register queues
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'analytics' },
      { name: 'ai-processing' },
      { name: 'cleanup' },
      { name: 'leaderboard' },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
```

---

# 3.2 Queue Options

```typescript
// queues/queue.types.ts
export const QUEUE_OPTIONS = {
  email: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,  // Keep last 100
      removeOnFail: 1000,     // Keep last 1000 for debugging
    },
  },
  notification: {
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 500,
    },
  },
  analytics: {
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    },
  },
};
```

---

# 4. Scheduled Jobs

# 4.1 Using @nestjs/schedule

```typescript
// jobs/scheduled-jobs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  // Every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyJob() {
    this.logger.log('Running hourly job');
    // Update leaderboard, cleanup temp files, etc.
  }

  // Every day at midnight
  @Cron('0 0 * * *')
  async handleDailyJob() {
    this.logger.log('Running daily job');
    // Reset daily counters, generate reports, etc.
  }

  // Every Monday at 6 AM
  @Cron('0 6 * * 1')
  async handleWeeklyJob() {
    this.logger.log('Running weekly job');
    // Send weekly emails, aggregate stats, etc.
  }

  // First day of month at midnight
  @Cron('0 0 1 * *')
  async handleMonthlyJob() {
    this.logger.log('Running monthly job');
    // Generate monthly reports, archive data, etc.
  }
}
```

---

# 4.2 BullMQ Scheduled Jobs

```typescript
// jobs/leaderboard.job.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('leaderboard')
export class LeaderboardProcessor extends WorkerHost {
  constructor(
    private readonly leaderboardService: LeaderboardService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing leaderboard job ${job.id}`);

    switch (job.name) {
      case 'generate-daily':
        await this.leaderboardService.generateDailyLeaderboard();
        break;
      case 'generate-weekly':
        await this.leaderboardService.generateWeeklyLeaderboard();
        break;
      case 'generate-monthly':
        await this.leaderboardService.generateMonthlyLeaderboard();
        break;
    }
  }
}
```

---

# 5. Job Definitions

# 5.1 Daily Jobs

# Reset Daily Counters

```typescript
// jobs/daily-counter-reset.job.ts
@Cron('0 0 * * *') // Midnight
async resetDailyCounters() {
  // This is handled by the analytics aggregation
  // Mark yesterday's stats as final
  await this.analyticsService.finalizeDailyStats();
}
```

---

# Generate Leaderboard

```typescript
// jobs/leaderboard-generator.job.ts
@Cron('0 * * * *') // Every hour
async generateLeaderboard() {
  await this.leaderboardQueue.add('generate-daily', {}, {
    jobId: `leaderboard-daily-${Date.now()}`,
    removeOnComplete: true,
  });
}
```

---

# Update Streaks

```typescript
// jobs/streak-update.job.ts
@Cron('0 0 * * *') // Midnight
async updateStreaks() {
  const yesterday = subDays(startOfDay(new Date()), 1);

  // Get users who didn't study yesterday
  const inactiveUsers = await this.userService.getUsersWithoutActivity(yesterday);

  for (const user of inactiveUsers) {
    // Reset streak if not active yesterday
    if (user.streakDays > 0) {
      await this.userService.breakStreak(user.id);
      await this.notificationService.send({
        userId: user.id,
        type: 'streak_broken',
        title: 'Streak Broken',
        message: 'Your streak has been reset. Start a new one today!',
      });
    }
  }

  // Emit streak broken events
  for (const user of inactiveUsers) {
    await this.eventEmitter.emit({
      id: uuid(),
      event: 'progress.streak_broken',
      userId: user.id,
      payload: {
        previousStreak: user.streakDays,
      },
    });
  }
}
```

---

# Cleanup Expired Sessions

```typescript
// jobs/session-cleanup.job.ts
@Cron('0 1 * * *') // 1 AM
async cleanupExpiredSessions() {
  const cutoffDate = subDays(new Date(), 7);

  // Delete old sessions
  const deletedCount = await this.sessionService.deleteOldSessions(cutoffDate);

  // Delete old refresh tokens
  const tokensDeleted = await this.authService.deleteExpiredTokens();

  // Clean up expired password reset tokens
  const resetsDeleted = await this.authService.deleteExpiredPasswordResets();

  this.logger.log({
    message: 'Session cleanup completed',
    deletedSessions: deletedCount,
    deletedTokens: tokensDeleted,
    deletedResets: resetsDeleted,
  });
}
```

---

# Cleanup Temp Files

```typescript
// jobs/temp-file-cleanup.job.ts
@Cron('0 2 * * *') // 2 AM
async cleanupTempFiles() {
  const cutoffDate = subHours(new Date(), 24);

  // Delete old temp uploads
  const deleted = await this.fileService.deleteOldTempFiles(cutoffDate);

  // Delete orphaned files (uploaded but not processed)
  const orphaned = await this.fileService.cleanupOrphanedFiles();

  this.logger.log({
    message: 'Temp file cleanup completed',
    deletedTemp: deleted,
    deletedOrphaned: orphaned,
  });
}
```

---

# 5.2 Weekly Jobs

# Generate Weekly Reports

```typescript
// jobs/weekly-report.job.ts
@Cron('0 6 * * 1') // Monday 6 AM
async generateWeeklyReports() {
  const lastWeek = {
    start: startOfWeek(subWeeks(new Date(), 1)),
    end: endOfWeek(subWeeks(new Date(), 1)),
  };

  // Get all users
  const users = await this.userService.findAll({
    where: { notificationPrefs: { weeklyReport: true } },
  });

  // Generate report for each user
  for (const user of users) {
    const report = await this.analyticsService.generateWeeklyReport(
      user.id,
      lastWeek
    );

    await this.emailQueue.add('send-weekly-report', {
      userId: user.id,
      report,
    });
  }
}
```

---

# Send Email Digests

```typescript
// jobs/email-digest.job.ts
@Cron('0 9 * * *') // Daily at 9 AM
async sendEmailDigest() {
  // Find users who prefer morning emails
  const users = await this.userService.findByEmailPreference('morning');

  for (const user of users) {
    const digest = await this.digestService.generateDailyDigest(user.id);

    await this.emailQueue.add('send-digest', {
      userId: user.id,
      type: 'daily_digest',
      content: digest,
    });
  }
}
```

---

# Aggregate Weekly Analytics

```typescript
// jobs/weekly-aggregation.job.ts
@Cron('0 3 * * 1') // Monday 3 AM
async aggregateWeeklyAnalytics() {
  const lastWeek = {
    start: startOfWeek(subWeeks(new Date(), 1)),
    end: endOfWeek(subWeeks(new Date(), 1)),
  };

  // Aggregate DAU per day
  await this.analyticsService.aggregateWeeklyDAU(lastWeek);

  // Calculate retention
  await this.analyticsService.calculateWeeklyRetention(lastWeek);

  // Update cohorts
  await this.analyticsService.updateWeeklyCohorts(lastWeek);
}
```

---

# 5.3 Monthly Jobs

# Generate Monthly Reports

```typescript
// jobs/monthly-report.job.ts
@Cron('0 8 1 * *') // First day of month, 8 AM
async generateMonthlyReports() {
  const lastMonth = {
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  };

  // Generate reports for admin
  const report = await this.analyticsService.generateMonthlyReport(lastMonth);

  await this.emailQueue.add('send-monthly-report', {
    to: 'admin@example.com',
    report,
  });
}
```

---

# Cleanup Inactive Users

```typescript
// jobs/inactive-user-cleanup.job.ts
@Cron('0 4 1 * *') // First day of month, 4 AM
async cleanupInactiveUsers() {
  const sixMonthsAgo = subMonths(new Date(), 6);

  // Find users inactive for 6 months
  const inactiveUsers = await this.userService.findInactiveUsers(sixMonthsAgo);

  // Send re-engagement email
  for (const user of inactiveUsers) {
    await this.emailQueue.add('send-reengagement', {
      userId: user.id,
    });
  }

  // Mark for review
  const oneYearAgo = subMonths(new Date(), 12);
  const veryInactive = await this.userService.findInactiveUsers(oneYearAgo);

  for (const user of veryInactive) {
    // Anonymize or delete based on GDPR compliance
    await this.userService.anonymizeUser(user.id);
  }
}
```

---

# Archive Old Logs

```typescript
// jobs/log-archive.job.ts
@Cron('0 5 1 * *') // First day of month, 5 AM
async archiveOldLogs() {
  const threeMonthsAgo = subMonths(new Date(), 3);

  // Archive analytics events
  await this.analyticsService.archiveEvents(threeMonthsAgo);

  // Archive audit logs
  await this.auditService.archiveOldLogs(threeMonthsAgo);

  // Clean up archived data older than 2 years
  const twoYearsAgo = subYears(new Date(), 2);
  await this.analyticsService.deleteArchivedEvents(twoYearsAgo);
}
```

---

# 6. Queue Processors

# 6.1 Email Queue

```typescript
// processors/email.processor.ts
@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { type, data } = job.data;

    switch (type) {
      case 'welcome':
        await this.emailService.sendWelcomeEmail(data);
        break;
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(data);
        break;
      case 'weekly-report':
        await this.emailService.sendWeeklyReport(data);
        break;
      case 'daily-digest':
        await this.emailService.sendDailyDigest(data);
        break;
    }

    await job.updateProgress(100);
  }
}
```

---

# 6.2 Notification Queue

```typescript
// processors/notification.processor.ts
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushNotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { type, userId, data } = job.data;

    // Save to database
    const notification = await this.notificationService.create({
      userId,
      type,
      ...data,
    });

    // Send real-time notification
    await this.notificationService.sendRealTime(userId, notification);

    // Send push notification if enabled
    const user = await this.userService.findById(userId);
    if (user.notificationPrefs?.pushEnabled) {
      await this.pushService.send(user.pushToken, {
        title: data.title,
        body: data.message,
      });
    }

    await job.updateProgress(100);
  }
}
```

---

# 6.3 Analytics Queue

```typescript
// processors/analytics.processor.ts
@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { type, events } = job.data;

    switch (type) {
      case 'batch-events':
        await this.analyticsService.processEventBatch(events);
        break;
      case 'update-daily-stats':
        await this.analyticsService.updateDailyStats(job.data);
        break;
      case 'aggregate-metrics':
        await this.analyticsService.aggregateMetrics(job.data);
        break;
    }

    await job.updateProgress(100);
  }
}
```

---

# 7. Job Monitoring

# 7.1 Job Metrics

```typescript
// metrics/job-metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const jobsCompleted = new Counter({
  name: 'queue_jobs_completed_total',
  help: 'Total completed queue jobs',
  labelNames: ['queue', 'job_name'],
});

export const jobsFailed = new Counter({
  name: 'queue_jobs_failed_total',
  help: 'Total failed queue jobs',
  labelNames: ['queue', 'job_name'],
});

export const jobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job duration',
  labelNames: ['queue', 'job_name'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
});
```

---

# 7.2 Job Dashboard

```typescript
// GET /admin/jobs/stats
interface JobStats {
  queues: {
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }[];
  recentJobs: {
    id: string;
    name: string;
    queue: string;
    status: 'completed' | 'failed' | 'active';
    duration: number;
    timestamp: Date;
  }[];
  failedJobs: {
    id: string;
    name: string;
    queue: string;
    error: string;
    failedAt: Date;
    attempts: number;
  }[];
}
```

---

# 8. Error Handling

# 8.1 Dead Letter Queue

```typescript
// Configure DLQ
const queue = new Queue('email', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Move failed jobs to DLQ
queue.on('failed', async (job, error) => {
  await this.dlqService.add({
    originalQueue: job.queueName,
    jobId: job.id,
    jobData: job.data,
    error: error.message,
    failedAt: new Date(),
    attempts: job.attemptsMade,
  });

  // Alert
  await this.alertingService.alert({
    severity: 'warning',
    title: 'Job moved to DLQ',
    description: `Job ${job.id} failed after ${job.attemptsMade} attempts`,
  });
});
```

---

# 8.2 Retry Strategy

```typescript
// Custom retry logic
const retryStrategy = (maxRetries: number) => {
  return async (job: Job) => {
    // Don't retry certain job types
    if (job.name === 'send-critical') {
      return null; // Don't retry
    }

    // Exponential backoff for API jobs
    if (job.name === 'sync-external') {
      return Math.min(job.attemptsMade * 60000, 10 * 60000);
    }

    // Fixed delay for email jobs
    if (job.queue.name === 'email') {
      return job.attemptsMade * 5000;
    }

    // Default exponential
    return Math.min(job.attemptsMade * 1000, 30000);
  };
};
```

---

# 9. Job Scheduling Best Practices

# 9.1 Idempotency

```typescript
// Make jobs idempotent
async function generateDailyLeaderboard(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Check if already generated
  const existing = await this.leaderboardRepository.findByDate(dateStr);
  if (existing) {
    this.logger.log(`Leaderboard for ${dateStr} already exists, skipping`);
    return;
  }

  // Generate new leaderboard
  const rankings = await this.calculateRankings(date);
  await this.leaderboardRepository.create({ date: dateStr, rankings });
}
```

---

# 9.2 Job Chaining

```typescript
// Chain dependent jobs
async function runMonthlyReport() {
  // Step 1: Aggregate data
  const aggregationJob = await this.analyticsQueue.add(
    'aggregate-monthly',
    { month: lastMonth },
    { jobId: 'monthly-aggregate' }
  );

  // Step 2: Generate report (after aggregation)
  await this.reportQueue.add(
    'generate-monthly',
    { month: lastMonth },
    {
      jobId: 'monthly-report',
      dependencies: [aggregationJob.id],
    }
  );

  // Step 3: Send report (after generation)
  await this.emailQueue.add(
    'send-monthly-report',
    { month: lastMonth },
    {
      jobId: 'monthly-email',
      dependencies: ['monthly-report'],
    }
  );
}
```

---

# 9.3 Concurrency Control

```typescript
// Limit concurrent jobs
const worker = new Worker('leaderboard', async job => {
  await processLeaderboard(job.data);
}, {
  concurrency: 2, // Only 2 leaderboard jobs at a time
});

// Global concurrency
const globalWorker = new Worker('*', async job => {
  // Process any job
}, {
  concurrency: 10, // Max 10 concurrent jobs overall
});
```

---

# 10. Manual Job Execution

# 10.1 Admin API

```typescript
// POST /admin/jobs/run
interface RunJobRequest {
  jobName: string;
  queue: string;
  data: Record<string, any>;
  options?: {
    priority?: number;
    delay?: number;
    repeat?: { pattern: string };
  };
}

// POST /admin/jobs/:id/retry
interface RetryJobRequest {
  jobId: string;
}

// DELETE /admin/jobs/:id
// Cancel a pending job
```

---

# 10.2 CLI Commands

```typescript
// scripts/run-job.ts
// Usage: npm run job:run -- generate-leaderboard --date 2024-01-01
@Injectable()
export class JobCliService {
  async runJob(name: string, args: Record<string, string>) {
    const job = this.getJob(name);
    await job(args);
  }
}
```

---

# 11. Timezone Handling

# 11.1 Timezone-aware Jobs

```typescript
// All scheduled times are UTC
// Convert to user timezone for display

// Daily job at midnight UTC = 7 AM Vietnam time
@Cron('0 0 * * *')
async handleDailyJobUTC() {
  // Process in UTC
  const todayUTC = new Date();

  // For user-facing content, use their timezone
  const userTimezone = 'Asia/Ho_Chi_Minh';
  const todayLocal = utcToZonedTime(todayUTC, userTimezone);

  // Generate report for "today" in user's timezone
  await this.generateDailyReport(todayLocal);
}
```

---

# 12. Checklist

- [x] BullMQ setup
- [x] Queue definitions
- [x] Daily jobs
- [x] Weekly jobs
- [x] Monthly jobs
- [x] Job processors
- [x] Error handling
- [x] Dead letter queue
- [x] Retry strategy
- [x] Job monitoring
- [x] Idempotency
- [ ] Job chaining
- [ ] Manual execution API

---

# 13. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
