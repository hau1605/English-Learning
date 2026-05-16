import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AdminController } from '@/modules/admin/controllers/admin.controller';
import { AdminService } from '@/modules/admin/services/admin.service';
import { UsersModule } from '@/modules/users/users.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [PrismaModule, UsersModule, PermissionsModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
