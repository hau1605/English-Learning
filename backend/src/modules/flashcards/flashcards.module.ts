import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { FlashcardsController } from "@/modules/flashcards/controllers/flashcards.controller";
import { FlashcardsService } from "@/modules/flashcards/services/flashcards.service";
import { FlashcardsRepository } from "@/modules/flashcards/repositories/flashcards.repository";
import { UsersModule } from "@/modules/users/users.module";
import { PermissionsModule } from "@/modules/permissions/permissions.module";
import { VocabularyModule } from "@/modules/vocabulary/vocabulary.module";
import { PointsModule } from "@/modules/points/points.module";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PermissionsModule,
    VocabularyModule,
    PointsModule,
  ],
  controllers: [FlashcardsController],
  providers: [FlashcardsService, FlashcardsRepository],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
