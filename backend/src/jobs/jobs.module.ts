import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StreakScheduler } from '@/jobs/schedulers/streak.scheduler';
import { LeaderboardScheduler } from '@/jobs/schedulers/leaderboard.scheduler';
import { RetentionScheduler } from '@/jobs/schedulers/retention.scheduler';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/common/redis/redis.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { MediaModule } from '@/modules/media/media.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    NotificationsModule,
    AnalyticsModule,
    MediaModule,
  ],
  providers: [StreakScheduler, LeaderboardScheduler, RetentionScheduler],
  exports: [StreakScheduler, LeaderboardScheduler, RetentionScheduler],
})
export class JobsModule {}
