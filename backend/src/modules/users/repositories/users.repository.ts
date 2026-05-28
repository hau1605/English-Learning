import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { PaginationParams, PaginatedResult } from '@/common/interfaces';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { SafeUserDto } from '@/modules/users/dto/safe-user.dto';
import { User } from '@prisma/client';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache-keys';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private toSafeUser(user: User & { userRoles?: { role: { code: string } }[] }): SafeUserDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || undefined,
      level: user.level,
      xp: user.xp,
      streakDays: user.streakDays,
      status: user.status,
      roleCodes: user.userRoles?.map((ur) => ur.role.code),
    };
  }

  async findById(id: string) {
    const cacheKey = CACHE_KEYS.USER.PROFILE(id);
    const cached = await this.redis.getJson<SafeUserDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    const safeUser = this.toSafeUser(user);
    await this.redis.setJson(cacheKey, safeUser, CACHE_TTL.LONG);
    return safeUser;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return this.toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
      },
    });

    // Invalidate user cache
    await this.invalidateUserCache(id);

    return this.toSafeUser(user);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.USER.PROFILE(userId));
    await this.redis.del(CACHE_KEYS.USER.PERMISSIONS(userId));
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<SafeUserDto>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: data.map((user) => this.toSafeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }
}
