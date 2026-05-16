import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GrammarController } from '@/modules/grammar/controllers/grammar.controller';
import { GrammarService } from '@/modules/grammar/services/grammar.service';

@Module({
  imports: [PrismaModule],
  controllers: [GrammarController],
  providers: [GrammarService],
  exports: [GrammarService],
})
export class GrammarModule {}
