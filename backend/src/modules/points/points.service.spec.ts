import { Test } from "@nestjs/testing";
import { PointsService } from "./points.service";
import { PrismaService } from "@/prisma/prisma.service";
import { LeaderboardRepository } from "@/modules/leaderboard/repositories/leaderboard.repository";
import { EventService } from "@/modules/events/services/event.service";
import { RedisService } from "@/common/redis/redis.service";

const mockPrisma = {
  user: {
    update: jest.fn().mockResolvedValue({ xp: 50, level: 1 }),
  },
};
const mockLeaderboard = {
  updateUserXp: jest.fn().mockResolvedValue(undefined),
};
const mockEvent = { emitXpUpdated: jest.fn() };
const mockRedis = { del: jest.fn().mockResolvedValue(undefined) };

describe("PointsService", () => {
  let service: PointsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.update.mockResolvedValue({ xp: 50, level: 1 });
    const module = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LeaderboardRepository, useValue: mockLeaderboard },
        { provide: EventService, useValue: mockEvent },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get(PointsService);
  });

  it("awards xp and updates leaderboard", async () => {
    await service.awardXp("user1", 50, "test");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user1" } }),
    );
    expect(mockLeaderboard.updateUserXp).toHaveBeenCalledWith("user1", 50);
    expect(mockEvent.emitXpUpdated).toHaveBeenCalledWith("user1", 50, "test");
  });
});
