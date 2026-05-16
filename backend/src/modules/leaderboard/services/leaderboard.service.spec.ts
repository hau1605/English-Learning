import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardRepository, LeaderboardUser } from '../repositories/leaderboard.repository';
import { LeaderboardPeriod, LeaderboardEntryDto } from '../dto/leaderboard.dto';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let leaderboardRepository: jest.Mocked<LeaderboardRepository>;

  const mockUserId = 'user-2';

  const mockLeaderboardUsers: LeaderboardUser[] = [
    {
      userId: 'user-1',
      fullName: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg',
      xp: 1500,
      level: 5,
      streakDays: 7,
      rank: 1,
      weekXp: 100,
      monthXp: 500,
    },
    {
      userId: 'user-2',
      fullName: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg',
      xp: 1200,
      level: 4,
      streakDays: 5,
      rank: 2,
      weekXp: 80,
      monthXp: 400,
    },
    {
      userId: 'user-3',
      fullName: 'Bob Wilson',
      xp: 900,
      level: 3,
      rank: 3,
    },
  ];

  beforeEach(async () => {
    const mockLeaderboardRepository = {
      getGlobalLeaderboard: jest.fn(),
      getWeeklyLeaderboard: jest.fn(),
      getMonthlyLeaderboard: jest.fn(),
      getUserRank: jest.fn(),
      updateUserXp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: LeaderboardRepository, useValue: mockLeaderboardRepository },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    leaderboardRepository = module.get(LeaderboardRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should return weekly leaderboard by default', async () => {
      leaderboardRepository.getWeeklyLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getLeaderboard();

      expect(leaderboardRepository.getWeeklyLeaderboard).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockLeaderboardUsers);
    });

    it('should return daily leaderboard when period is DAILY', async () => {
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getLeaderboard(LeaderboardPeriod.DAILY);

      expect(leaderboardRepository.getGlobalLeaderboard).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockLeaderboardUsers);
    });

    it('should return weekly leaderboard when period is WEEKLY', async () => {
      leaderboardRepository.getWeeklyLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getLeaderboard(LeaderboardPeriod.WEEKLY);

      expect(leaderboardRepository.getWeeklyLeaderboard).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockLeaderboardUsers);
    });

    it('should return monthly leaderboard when period is MONTHLY', async () => {
      leaderboardRepository.getMonthlyLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getLeaderboard(LeaderboardPeriod.MONTHLY);

      expect(leaderboardRepository.getMonthlyLeaderboard).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockLeaderboardUsers);
    });

    it('should return all-time leaderboard when period is ALL_TIME', async () => {
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getLeaderboard(LeaderboardPeriod.ALL_TIME);

      expect(leaderboardRepository.getGlobalLeaderboard).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockLeaderboardUsers);
    });

    it('should respect custom limit parameter', async () => {
      leaderboardRepository.getWeeklyLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      await service.getLeaderboard(LeaderboardPeriod.WEEKLY, 50);

      expect(leaderboardRepository.getWeeklyLeaderboard).toHaveBeenCalledWith(50);
    });
  });

  describe('getUserRank', () => {
    it('should return user rank when user exists', async () => {
      const rankData = {
        rank: 42,
        xp: 1500,
        level: 5,
        totalUsers: 100,
      };
      leaderboardRepository.getUserRank.mockResolvedValue(rankData);

      const result = await service.getUserRank(mockUserId);

      expect(leaderboardRepository.getUserRank).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        rank: 42,
        xp: 1500,
        level: 5,
        totalUsers: 100,
      });
    });

    it('should return null when user does not exist', async () => {
      leaderboardRepository.getUserRank.mockResolvedValue(null);

      const result = await service.getUserRank(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getUserPosition', () => {
    it('should return user position in leaderboard', async () => {
      leaderboardRepository.getUserRank.mockResolvedValue({
        rank: 2,
        xp: 1200,
        level: 4,
        totalUsers: 100,
      });
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue(mockLeaderboardUsers);

      const result = await service.getUserPosition(mockUserId);

      expect(result?.userId).toBe('user-2');
      expect(result?.rank).toBe(2);
    });

    it('should return null when user has no rank data', async () => {
      leaderboardRepository.getUserRank.mockResolvedValue(null);

      const result = await service.getUserPosition(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when user not found in leaderboard', async () => {
      leaderboardRepository.getUserRank.mockResolvedValue({
        rank: 99,
        xp: 100,
        level: 1,
        totalUsers: 100,
      });
      // Mock global leaderboard that doesn't include this user
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue([]);

      const result = await service.getUserPosition(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('addXpToUser', () => {
    it('should call repository to add XP', async () => {
      leaderboardRepository.updateUserXp.mockResolvedValue(undefined);

      await service.addXpToUser(mockUserId, 100);

      expect(leaderboardRepository.updateUserXp).toHaveBeenCalledWith(mockUserId, 100);
    });
  });

  describe('getTopUsers', () => {
    it('should return top users from global leaderboard', async () => {
      const topUsers = mockLeaderboardUsers.slice(0, 3);
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue(topUsers);

      const result = await service.getTopUsers(3);

      expect(leaderboardRepository.getGlobalLeaderboard).toHaveBeenCalledWith(3);
      expect(result).toEqual(topUsers);
    });

    it('should default to 10 users when no limit provided', async () => {
      leaderboardRepository.getGlobalLeaderboard.mockResolvedValue([]);

      await service.getTopUsers();

      expect(leaderboardRepository.getGlobalLeaderboard).toHaveBeenCalledWith(10);
    });
  });
});
