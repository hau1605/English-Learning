import Redis from "ioredis";
import { RedisService } from "@/common/redis/redis.service";

describe("RedisService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the deleted key count when Redis del succeeds", async () => {
    jest.spyOn(Redis.prototype, "del").mockResolvedValue(1);

    const service = Object.create(RedisService.prototype) as RedisService;
    (service as any).logger = { warn: jest.fn() };

    await expect(service.del("session:1")).resolves.toBe(1);
  });

  it("does not throw when Redis del fails", async () => {
    jest
      .spyOn(Redis.prototype, "del")
      .mockRejectedValue(new Error("Connection is closed."));

    const service = Object.create(RedisService.prototype) as RedisService;
    const warn = jest.fn();
    (service as any).logger = { warn };

    await expect(service.del("session:1")).resolves.toBe(0);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Redis del failed for keys session:1"),
    );
  });
});
