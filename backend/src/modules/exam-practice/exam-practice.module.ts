import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { PointsModule } from "@/modules/points/points.module";
import { ExamPracticeController } from "@/modules/exam-practice/controllers/exam-practice.controller";
import { ExamPracticeService } from "@/modules/exam-practice/services/exam-practice.service";
import { PermissionsModule } from "../permissions/permissions.module";

@Module({
  imports: [PrismaModule, PointsModule, PermissionsModule],
  controllers: [ExamPracticeController],
  providers: [ExamPracticeService],
  exports: [ExamPracticeService],
})
export class ExamPracticeModule {}
