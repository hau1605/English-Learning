import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/common/redis/redis.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { MenuController } from '@/modules/menu/controllers/menu.controller';
import { MenuService } from '@/modules/menu/services/menu.service';
import { MenuRepository } from '@/modules/menu/repositories/menu.repository';

@Module({
  imports: [PrismaModule, RedisModule, PermissionsModule],
  controllers: [MenuController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService],
})
export class MenuModule {}
