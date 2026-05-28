import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MenuItem, RoleMenuAccess } from '@prisma/client';

export interface MenuItemWithRoleAccess {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  path: string;
  orderIndex: number;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: { id: string; code: string; label: string } | null;
  roleAccess: (RoleMenuAccess & { role: { id: string; code: string; name: string } })[];
  children?: MenuItemWithRoleAccess[];
}

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive: boolean = false): Promise<MenuItemWithRoleAccess[]> {
    const where = includeInactive ? {} : { isActive: true };
    
    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      include: {
        parent: {
          select: { id: true, code: true, label: true },
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: { id: true, code: true, label: true, icon: true, path: true, orderIndex: true, isActive: true },
        },
        roleAccess: {
          include: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    }) as unknown as MenuItemWithRoleAccess[];
  }

  async findById(id: string): Promise<MenuItemWithRoleAccess | null> {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, label: true },
        },
        children: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, code: true, label: true, icon: true, path: true, orderIndex: true, isActive: true },
        },
        roleAccess: {
          include: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
    return item as MenuItemWithRoleAccess | null;
  }

  async findByCode(code: string): Promise<MenuItemWithRoleAccess | null> {
    const item = await this.prisma.menuItem.findUnique({
      where: { code },
      include: {
        roleAccess: {
          include: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
    return item as MenuItemWithRoleAccess | null;
  }

  async findByRoleIds(roleIds: string[], activeOnly: boolean = true): Promise<MenuItemWithRoleAccess[]> {
    const whereCondition: any = {};

    if (activeOnly) {
      whereCondition.isActive = true;
    }

    if (roleIds.length === 0) {
      return [];
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        ...whereCondition,
        OR: [
          { roleAccess: { some: { roleId: { in: roleIds } } } },
          { roleAccess: { none: {} } },
        ],
      },
      orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }],
      include: {
        roleAccess: {
          include: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    return menuItems as MenuItemWithRoleAccess[];
  }

  async create(data: {
    code: string;
    label: string;
    icon?: string;
    path: string;
    orderIndex?: number;
    parentId?: string;
    isActive?: boolean;
    roleIds?: string[];
  }) {
    const { roleIds, ...menuData } = data;

    const menuItem = await this.prisma.menuItem.create({
      data: {
        ...menuData,
        roleAccess: roleIds && roleIds.length > 0
          ? {
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : undefined,
      },
      include: {
        parent: {
          select: { id: true, code: true, label: true },
        },
        roleAccess: {
          include: {
            role: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    return menuItem;
  }

  async update(
    id: string,
    data: {
      code?: string;
      label?: string;
      icon?: string | null;
      path?: string;
      orderIndex?: number;
      parentId?: string | null;
      isActive?: boolean;
      roleIds?: string[];
    },
  ) {
    const { roleIds, ...menuData } = data;

    if (roleIds !== undefined) {
      await this.prisma.roleMenuAccess.deleteMany({
        where: { menuItemId: id },
      });
    }

    const menuItem = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...menuData,
        roleAccess:
          roleIds && roleIds.length > 0
            ? {
                create: roleIds.map((roleId) => ({
                  role: { connect: { id: roleId } },
                })),
              }
            : roleIds !== undefined && roleIds.length === 0
              ? { deleteMany: {} }
              : undefined,
      },
      include: {
        parent: {
          select: { id: true, code: true, label: true },
        },
        roleAccess: {
          include: {
            role: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    return menuItem;
  }

  async delete(id: string) {
    await this.prisma.roleMenuAccess.deleteMany({
      where: { menuItemId: id },
    });

    await this.prisma.menuItem.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async updateOrder(id: string, orderIndex: number, parentId?: string | null) {
    return this.prisma.menuItem.update({
      where: { id },
      data: {
        orderIndex,
        parentId: parentId === undefined ? undefined : parentId,
      },
    });
  }

  async getMaxOrderIndex(parentId?: string) {
    const result = await this.prisma.menuItem.aggregate({
      where: parentId ? { parentId } : { parentId: null },
      _max: { orderIndex: true },
    });
    return result._max.orderIndex ?? -1;
  }

  async bulkUpdateOrder(items: { id: string; orderIndex: number; parentId?: string | null }[]) {
    const updates = items.map((item) =>
      this.prisma.menuItem.update({
        where: { id: item.id },
        data: {
          orderIndex: item.orderIndex,
          parentId: item.parentId === undefined ? undefined : item.parentId,
        },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
