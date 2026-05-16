import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { CACHE_KEYS } from '@/common/constants/cache-keys';
import { RESPONSE_MESSAGES } from '@/common/constants/response-messages';
import { hashPassword, verifyPassword } from '@/common/utils';
import { JwtPayload, TokenPair, SessionInfo } from '@/common/interfaces';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CreateUserDto): Promise<TokenPair & { userId: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(RESPONSE_MESSAGES.AUTH.EMAIL_EXISTS);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        status: 'PENDING_VERIFICATION',
      },
    });

    const sessionId = uuidv4();
    const tokens = await this.generateTokens(user.id, sessionId);

    await this.createSession(user.id, sessionId, tokens.refreshToken);

    await this.assignDefaultRole(user.id);

    this.logger.log(`User registered: ${user.email}`);

    return {
      ...tokens,
      userId: user.id,
    };
  }

  async login(dto: LoginDto): Promise<TokenPair & { userId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const sessionId = uuidv4();
    const tokens = await this.generateTokens(user.id, sessionId);

    await this.createSession(user.id, sessionId, tokens.refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      userId: user.id,
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.redis.del(CACHE_KEYS.USER.SESSION(sessionId));
    await this.redis.del(CACHE_KEYS.USER.PERMISSIONS(userId));

    this.logger.log(`User logged out: ${userId}`);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.redis.delPattern(`session:${userId}:*`);
    await this.redis.del(CACHE_KEYS.USER.PERMISSIONS(userId));

    this.logger.log(`User logged out from all devices: ${userId}`);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair & { userId: string }> {
    const payload = this.verifyRefreshToken(refreshToken);

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED);
    }

    if (session.user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    const isRefreshTokenValid = await verifyPassword(refreshToken, session.refreshToken);
    if (!isRefreshTokenValid) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }

    await this.revokeSession(session.id);

    const newSessionId = uuidv4();
    const tokens = await this.generateTokens(session.userId, newSessionId);

    await this.createSession(session.userId, newSessionId, tokens.refreshToken);

    this.logger.log(`Tokens refreshed for user: ${session.userId}`);

    return {
      ...tokens,
      userId: session.userId,
    };
  }

  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const cachedSession = await this.redis.getJson<SessionInfo>(
      CACHE_KEYS.USER.SESSION(sessionId),
    );

    if (cachedSession) {
      return cachedSession;
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    if (session.user.status === 'SUSPENDED') {
      return null;
    }

    const permissions = session.user.userRoles.flatMap((ur: any) =>
      ur.role.rolePermissions.map((rp: any) => rp.permission.code),
    );

    const sessionInfo: SessionInfo = {
      userId: session.userId,
      sessionId: session.id,
      email: session.user.email,
      roles: [...new Set<string>(session.user.userRoles.map((ur: any) => ur.role.code))],
      permissions: [...new Set<string>(permissions)],
      expiresAt: session.expiresAt,
    };

    await this.redis.setJson(
      CACHE_KEYS.USER.SESSION(sessionId),
      sessionInfo,
      300,
    );

    return sessionInfo;
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.redis.del(CACHE_KEYS.USER.SESSION(sessionId));
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  private verifyRefreshToken(token: string): JwtPayload {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    try {
      return this.jwtService.verify<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  private async generateTokens(userId: string, sessionId: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      sessionId,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      sessionId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private async createSession(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId,
        refreshToken: await hashPassword(refreshToken),
        expiresAt,
      },
    });
  }

  private async assignDefaultRole(userId: string): Promise<void> {
    const studentRole = await this.prisma.role.findUnique({
      where: { code: 'student' },
    });

    if (studentRole) {
      await this.prisma.userRole.create({
        data: {
          userId,
          roleId: studentRole.id,
        },
      });
    }
  }
}
