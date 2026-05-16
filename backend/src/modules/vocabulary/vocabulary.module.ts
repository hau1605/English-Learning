import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '@/prisma/prisma.module';
import { VocabularyController } from '@/modules/vocabulary/controllers/vocabulary.controller';
import { VocabularyService } from '@/modules/vocabulary/services/vocabulary.service';
import { VocabularyRepository } from '@/modules/vocabulary/repositories/vocabulary.repository';
import { PermissionsModule } from '@/modules/permissions/permissions.module';

@Module({
  imports: [
    PrismaModule,
    PermissionsModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    }),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService, VocabularyRepository],
  exports: [VocabularyService],
})
export class VocabularyModule {}
