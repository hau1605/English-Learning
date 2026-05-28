import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import Redis from "ioredis";

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
