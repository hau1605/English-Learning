import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/common/redis/redis.module';
import { PermissionsController } from '@/modules/permissions/controllers/permissions.controller';
import { PermissionsService } from '@/modules/permissions/services/permissions.service';
import { PermissionsRepository } from '@/modules/permissions/repositories/permissions.repository';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { RolesController } from '@/modules/permissions/controllers/roles.controller';
import { RolesService } from '@/modules/permissions/services/roles.service';
import { PermissionsSeeder } from './permissions.seeder';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [PermissionsController, RolesController],
  providers: [PermissionsService, PermissionsRepository, RolesService, PermissionGuard, PermissionsSeeder],
  exports: [PermissionsService, RolesService, PermissionGuard],
})
export class PermissionsModule {}
