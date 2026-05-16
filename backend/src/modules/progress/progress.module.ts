import { Module } from "@nestjs/common";
import { ProgressController } from "./controllers/progress.controller";
import { ProgressService } from "./services/progress.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { RedisModule } from "@/common/redis/redis.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { EmailModule } from "@/modules/email/email.module";
import { EventsModule } from "@/events/events.module";
import { PointsModule } from "../points/points.module";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    NotificationsModule,
    EmailModule,
    EventsModule,
    PointsModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
