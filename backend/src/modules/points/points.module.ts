import { Module } from "@nestjs/common";
import { PointsService } from "./points.service";
import { LeaderboardRepository } from "@/modules/leaderboard/repositories/leaderboard.repository";
import { PrismaModule } from "@/prisma/prisma.module";
import { RedisModule } from "@/common/redis/redis.module";
import { EventsModule } from "@/events/events.module";

@Module({
  imports: [PrismaModule, RedisModule, EventsModule],
  providers: [PointsService, LeaderboardRepository],
  exports: [PointsService],
})
export class PointsModule {}
