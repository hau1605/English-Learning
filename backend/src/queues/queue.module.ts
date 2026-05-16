import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QueueService } from "@/queues/queue.service";
import {
  EmailProcessor,
  NotificationProcessor,
  SpeakingProcessor,
} from "@/queues/processors/queue.processors";
import { PrismaModule } from "@/prisma/prisma.module";
import { PermissionsModule } from "@/modules/permissions/permissions.module";
import { QueueController } from "@/queues/controllers/queue.controller";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: "email" },
      { name: "notification" },
      { name: "speaking" },
    ),
    PrismaModule,
    PermissionsModule,
  ],
  providers: [
    QueueService,
    EmailProcessor,
    NotificationProcessor,
    SpeakingProcessor,
  ],
  exports: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
