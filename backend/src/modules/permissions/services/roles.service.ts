import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PermissionsService } from '@/modules/permissions/services/permissions.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async createRole(data: { name: string; code: string; description?: string }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      },
    });
  }

  async assignRoleToUser(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.create({
      data: { userId, roleId },
    });

    await this.permissionsService.invalidateUserPermissions(userId);

    return userRole;
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const result = await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });

    if (result.count > 0) {
      await this.permissionsService.invalidateUserPermissions(userId);
    }

    return result;
  }

  async addPermissionToRole(roleId: string, permissionId: string) {
    const rolePermission = await this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });

    const users = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    for (const user of users) {
      await this.permissionsService.invalidateUserPermissions(user.userId);
    }

    return rolePermission;
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const result = await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    if (result.count > 0) {
      const users = await this.prisma.userRole.findMany({
        where: { roleId },
        select: { userId: true },
      });

      for (const user of users) {
        await this.permissionsService.invalidateUserPermissions(user.userId);
      }
    }

    return result;
  }
}
