import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = userRoles.flatMap((ur: any) =>
      ur.role.rolePermissions.map((rp: any) => rp.permission.code),
    );

    return [...new Set<string>(permissions)];
  }

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string) {
    return this.prisma.permission.findUnique({
      where: { code },
    });
  }

  async create(data: { code: string; description?: string; resource: string; action: string }) {
    return this.prisma.permission.upsert({
      where: { code: data.code },
      update: {
        description: data.description,
        resource: data.resource,
        action: data.action,
      },
      create: {
        code: data.code,
        description: data.description,
        resource: data.resource,
        action: data.action,
      },
    });
  }
}
