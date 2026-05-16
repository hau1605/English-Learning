import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AnalyticsController } from '@/modules/analytics/controllers/analytics.controller';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
