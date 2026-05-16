import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersRepository } from '@/modules/users/repositories/users.repository';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { PaginationParams, PaginatedResult } from '@/common/interfaces';
import { SafeUserDto } from '@/modules/users/dto/safe-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findById(id: string): Promise<SafeUserDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<SafeUserDto | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUserDto> {
    await this.findById(id);

    return this.usersRepository.update(id, dto);
  }

  async updateXp(id: string, xpToAdd: number): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newXp = user.xp + xpToAdd;
    const newLevel = this.calculateLevel(newXp);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl || undefined,
      level: updatedUser.level,
      xp: updatedUser.xp,
      streakDays: updatedUser.streakDays,
      status: updatedUser.status,
      roleCodes: user.userRoles.map((ur) => ur.role.code),
    };
  }

  async updateStreak(id: string): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = user.lastStudyAt;
    let newStreak = user.streakDays;

    if (lastStudy) {
      const lastStudyDate = new Date(lastStudy);
      lastStudyDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        streakDays: newStreak,
        lastStudyAt: new Date(),
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl || undefined,
      level: updatedUser.level,
      xp: updatedUser.xp,
      streakDays: updatedUser.streakDays,
      status: updatedUser.status,
      roleCodes: user.userRoles.map((ur) => ur.role.code),
    };
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<SafeUserDto>> {
    return this.usersRepository.findAll(params);
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  private calculateLevel(xp: number): number {
    let level = 1;
    let xpNeeded = 100;

    while (xp >= xpNeeded) {
      xp -= xpNeeded;
      level++;
      xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
    }

    return level;
  }
}
