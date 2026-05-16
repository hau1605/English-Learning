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
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.setex(key, ttlSeconds, data);
    } else {
      await this.set(key, data);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.del(...keys);
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
