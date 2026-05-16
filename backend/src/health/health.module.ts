import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/common/redis/redis.module';
import {
  PrometheusModule,
  makeGaugeProvider,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: false },
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    makeGaugeProvider({
      name: 'active_users',
      help: 'Number of active users',
    }),
    makeCounterProvider({
      name: 'queue_jobs_total',
      help: 'Total queue jobs',
    }),
  ],
})
export class HealthModule {}
