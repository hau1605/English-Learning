import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import {
  MenuRepository,
  MenuItemWithRoleAccess,
} from "@/modules/menu/repositories/menu.repository";
import { RedisService } from "@/common/redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "@/common/constants/cache-keys";
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  ReorderMenuItemDto,
} from "@/modules/menu/dto/menu-item.dto";

export interface MenuItemResponse {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  path: string;
  orderIndex: number;
  parentId: string | null;
  parent: { id: string; code: string; label: string } | null;
  isActive: boolean;
  children: MenuItemResponse[];
  roles: { id: string; code: string; name: string }[];
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly redis: RedisService,
  ) {}

  private formatMenuItem(
    item: MenuItemWithRoleAccess,
    children: MenuItemResponse[] = [],
  ): MenuItemResponse {
    return {
      id: item.id,
      code: item.code,
      label: item.label,
      icon: item.icon,
      path: item.path,
      orderIndex: item.orderIndex,
      parentId: item.parentId,
      parent: (item as any).parent || null,
      isActive: item.isActive,
      children,
      roles: (item.roleAccess || []).map((ra: any) => ({
        id: ra.role.id,
        code: ra.role.code,
        name: ra.role.name,
      })),
    };
  }

  private buildTree(
    items: MenuItemWithRoleAccess[],
    parentId: string | null = null,
  ): MenuItemResponse[] {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => this.formatMenuItem(item, this.buildTree(items, item.id)));
  }

  async getAllMenus(
    includeInactive: boolean = false,
  ): Promise<MenuItemResponse[]> {
    const cacheKey = includeInactive
      ? `${CACHE_KEYS.MENU.ALL}:admin:v2`
      : `${CACHE_KEYS.MENU.ALL}:v2`;

    const cached = await this.redis.getJson<MenuItemResponse[]>(cacheKey);
    if (cached) {
      this.logger.debug("Menu cache hit");
      return cached;
    }

    const items = await this.menuRepository.findAll(includeInactive);
    console.log("Fetched all menu items from DB:", items); // Debug log
    const tree = this.buildTree(items, null);

    await this.redis.setJson(cacheKey, tree, CACHE_TTL.EXTRA_LONG);

    return tree;
  }

  async getMenuById(id: string): Promise<MenuItemResponse> {
    const item = await this.menuRepository.findById(id);

    if (!item) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }

    return this.formatMenuItem(item);
  }

  async getMenuForUser(roleCodes: string[]): Promise<MenuItemResponse[]> {
    if (!roleCodes || roleCodes.length === 0) {
      return [];
    }

    const cacheKey = `${CACHE_KEYS.MENU.USER(roleCodes)}:v2`;

    const cached = await this.redis.getJson<MenuItemResponse[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Menu cache hit for roles: ${roleCodes.join(",")}`);
      return cached;
    }

    const roles = await this.menuRepository.getAllRoles();
    const roleMap = new Map(roles.map((r) => [r.code, r]));
    const roleIds = roleCodes
      .map((code) => roleMap.get(code)?.id)
      .filter((id): id is string => !!id);

    if (roleIds.length === 0) {
      return [];
    }

    const items = await this.menuRepository.findByRoleIds(roleIds, true);

    const filteredItems = items.filter((item: MenuItemWithRoleAccess) => {
      if (item.roleAccess.length === 0) {
        return true;
      }
      return item.roleAccess.some((ra) => roleIds.includes(ra.roleId));
    });

    const tree = this.buildTree(filteredItems, null);

    await this.redis.setJson(cacheKey, tree, CACHE_TTL.MEDIUM);

    return tree;
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItemResponse> {
    const existing = await this.menuRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Menu item with code ${dto.code} already exists`,
      );
    }

    const roles = await this.menuRepository.getAllRoles();
    const roleMap = new Map(roles.map((r) => [r.code, r]));
    const roleIds =
      dto.roleCodes
        ?.map((code) => roleMap.get(code)?.id)
        .filter((id): id is string => !!id) || [];

    const orderIndex =
      dto.orderIndex ??
      (await this.menuRepository.getMaxOrderIndex(dto.parentId)) + 1;

    const item = await this.menuRepository.create({
      code: dto.code,
      label: dto.label,
      icon: dto.icon,
      path: dto.path,
      orderIndex,
      parentId: dto.parentId,
      isActive: dto.isActive ?? true,
      roleIds,
    });

    await this.invalidateCache();

    return this.formatMenuItem(item);
  }

  async updateMenuItem(
    id: string,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItemResponse> {
    const existing = await this.menuRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }

    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.menuRepository.findByCode(dto.code);
      if (codeExists) {
        throw new ConflictException(
          `Menu item with code ${dto.code} already exists`,
        );
      }
    }

    const roles =
      dto.roleCodes !== undefined
        ? await this.getRoleIdsFromCodes(dto.roleCodes)
        : undefined;

    const item = await this.menuRepository.update(id, {
      code: dto.code,
      label: dto.label,
      icon: dto.icon,
      path: dto.path,
      orderIndex: dto.orderIndex,
      parentId: dto.parentId,
      isActive: dto.isActive,
      roleIds: roles,
    });

    await this.invalidateCache();

    return this.formatMenuItem(item);
  }

  async deleteMenuItem(id: string): Promise<void> {
    const existing = await this.menuRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }

    await this.menuRepository.delete(id);
    await this.invalidateCache();
  }

  async reorderMenuItems(items: ReorderMenuItemDto[]): Promise<void> {
    await this.menuRepository.bulkUpdateOrder(
      items.map((item, index) => ({
        id: item.id,
        orderIndex: item.orderIndex ?? index,
        parentId: item.parentId,
      })),
    );

    await this.invalidateCache();
  }

  async getAllRoles() {
    return this.menuRepository.getAllRoles();
  }

  private async getRoleIdsFromCodes(codes: string[]): Promise<string[]> {
    const roles = await this.menuRepository.getAllRoles();
    const roleMap = new Map(roles.map((r) => [r.code, r]));
    return codes
      .map((code) => roleMap.get(code)?.id)
      .filter((id): id is string => !!id);
  }

  private async invalidateCache(): Promise<void> {
    await Promise.all([
      this.redis.del(CACHE_KEYS.MENU.ALL),
      this.redis.del(`${CACHE_KEYS.MENU.ALL}:admin`),
      this.redis.del(`${CACHE_KEYS.MENU.ALL}:v2`),
      this.redis.del(`${CACHE_KEYS.MENU.ALL}:admin:v2`),
      this.redis.delPattern("menu:user:*"),
    ]);
    this.logger.debug("Menu cache invalidated");
  }
}
