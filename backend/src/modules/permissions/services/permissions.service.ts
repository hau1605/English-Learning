import { Injectable, Logger } from '@nestjs/common';
import { PermissionsRepository } from '@/modules/permissions/repositories/permissions.repository';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly redis: RedisService,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = CACHE_KEYS.USER.PERMISSIONS(userId);

    const cached = await this.redis.getJson<string[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Permissions cache hit for user: ${userId}`);
      return cached;
    }

    const permissions = await this.permissionsRepository.getUserPermissions(userId);

    await this.redis.setJson(cacheKey, permissions, CACHE_TTL.MEDIUM);

    this.logger.debug(`Permissions cached for user: ${userId}`);

    return permissions;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission) || permissions.includes('*');
  }

  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some((p) => userPermissions.includes(p) || userPermissions.includes('*'));
  }

  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every((p) => userPermissions.includes(p) || userPermissions.includes('*'));
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.USER.PERMISSIONS(userId));
    this.logger.debug(`Permissions cache invalidated for user: ${userId}`);
  }

  async invalidateAllPermissions(): Promise<void> {
    await this.redis.delPattern('user:permissions:*');
    this.logger.debug('All permissions cache invalidated');
  }

  async getAllPermissions() {
    return this.permissionsRepository.findAll();
  }

  async createPermission(data: { code: string; description?: string; resource: string; action: string }) {
    return this.permissionsRepository.create(data);
  }
}
