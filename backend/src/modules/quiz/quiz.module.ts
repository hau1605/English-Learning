import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { QuizController } from "@/modules/quiz/controllers/quiz.controller";
import { QuizService } from "@/modules/quiz/services/quiz.service";
import { QuizRepository } from "@/modules/quiz/repositories/quiz.repository";
import { PermissionsModule } from "@/modules/permissions/permissions.module";
import { PointsModule } from "@/modules/points/points.module";

@Module({
  imports: [PrismaModule, PermissionsModule, PointsModule],
  controllers: [QuizController],
  providers: [QuizService, QuizRepository],
  exports: [QuizService],
})
export class QuizModule {}
