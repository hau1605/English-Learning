import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import Redis, { type Callback, type RedisKey } from "ioredis";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private cacheHits = 0;
  private cacheMisses = 0;
  constructor(options: { host: string; port: number; password?: string }) {
    super({
      host: options.host,
      port: options.port,
      password: options.password,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.on("connect", () => {
      this.logger.log("Redis connected");
    });

    this.on("error", (err) => {
      this.logger.error("Redis error:", err);
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }

  override del(
    ...args: [...keys: RedisKey[], callback: Callback<number>]
  ): Promise<number>;
  override del(
    ...args: [keys: RedisKey[], callback: Callback<number>]
  ): Promise<number>;
  override del(...args: [...keys: RedisKey[]]): Promise<number>;
  override del(...args: [keys: RedisKey[]]): Promise<number>;
  override async del(
    ...args:
      | [...keys: RedisKey[], callback: Callback<number>]
      | [keys: RedisKey[], callback: Callback<number>]
      | [...keys: RedisKey[]]
      | [keys: RedisKey[]]
  ): Promise<number> {
    const callback =
      typeof args[args.length - 1] === "function"
        ? (args[args.length - 1] as Callback<number>)
        : undefined;
    const commandArgs = callback ? args.slice(0, -1) : args;
    const keys =
      commandArgs.length === 1 && Array.isArray(commandArgs[0])
        ? commandArgs[0]
        : (commandArgs as RedisKey[]);

    if (keys.length === 0) {
      callback?.(null, 0);
      return 0;
    }

    try {
      const deletedCount = await super.del(...keys);
      callback?.(null, deletedCount);
      return deletedCount;
    } catch (error) {
      this.logger.warn(`Redis del failed for keys ${keys.join(",")}: ${error}`);
      callback?.(null, 0);
      return 0;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const data = await this.get(key);
      if (!data) {
        this.cacheMisses += 1;
        return null;
      }
      try {
        this.cacheHits += 1;
        return JSON.parse(data) as T;
      } catch {
        this.cacheMisses += 1;
        return null;
      }
    } catch (error) {
      this.logger.warn(`Redis getJson failed for key ${key}: ${error}`);
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.setex(key, ttlSeconds, data);
      } else {
        await this.set(key, data);
      }
    } catch (error) {
      this.logger.warn(`Redis setJson failed for key ${key}: ${error}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [newCursor, keys] = await this.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await this.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(`Redis delPattern failed for pattern ${pattern}: ${error}`);
    }
  }

  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }
}
