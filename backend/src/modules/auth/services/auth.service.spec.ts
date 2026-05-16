import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "@/common/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { hashPassword, verifyPassword } from "@/common/utils";

jest.mock("@/common/utils", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
  } as any;

  const jwt = {
    sign: jest.fn().mockReturnValue("token"),
    verify: jest
      .fn()
      .mockReturnValue({
        sub: "user-1",
        sessionId: "session-1",
        type: "access",
      }),
  } as any;

  const redis = {
    del: jest.fn(),
    delPattern: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  } as any;

  const config = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
      if (key === "JWT_REFRESH_EXPIRES_IN") return "7d";
      return defaultValue;
    }),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it("registers a new user and creates a session", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue("hashed-password");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: "role-1" });

    const result = await service.register({
      email: "test@example.com",
      password: "Password123!",
      fullName: "Test User",
    } as any);

    expect(result).toMatchObject({
      userId: "user-1",
      accessToken: "token",
      refreshToken: "token",
    });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.userSession.create).toHaveBeenCalled();
    expect(prisma.userRole.create).toHaveBeenCalled();
  });

  it("logs in an active user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hashed-password",
      status: "ACTIVE",
    });
    (verifyPassword as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: "test@example.com",
      password: "Password123!",
    } as any);

    expect(result).toMatchObject({
      userId: "user-1",
      accessToken: "token",
      refreshToken: "token",
    });
    expect(prisma.userSession.create).toHaveBeenCalled();
  });
});
