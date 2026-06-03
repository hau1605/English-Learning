import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    if (!this.isRateLimitEnabled()) {
      return true;
    }

    return super.canActivate(context);
  }

  private isRateLimitEnabled(): boolean {
    const rawValue = process.env.RATE_LIMIT_ENABLED;

    if (typeof rawValue === 'string' && rawValue.trim() !== '') {
      return ['true', '1', 'yes', 'on'].includes(rawValue.trim().toLowerCase());
    }

    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
