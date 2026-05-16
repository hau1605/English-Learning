import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { SpeakingController } from "@/modules/speaking/controllers/speaking.controller";
import { SpeakingService } from "@/modules/speaking/services/speaking.service";
import { QueueModule } from "@/queues/queue.module";
import { EventsModule } from "@/events/events.module";
import { PointsModule } from "@/modules/points/points.module";
import { PermissionsModule } from "@/modules/permissions/permissions.module";

@Module({
  imports: [PrismaModule, QueueModule, EventsModule, PointsModule, PermissionsModule],
  controllers: [SpeakingController],
  providers: [SpeakingService],
  exports: [SpeakingService],
})
export class SpeakingModule {}
