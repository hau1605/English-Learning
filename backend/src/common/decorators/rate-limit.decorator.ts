import { Throttle } from '@nestjs/throttler';

type ThrottlePolicy = {
  limitEnv: string;
  ttlEnv: string;
  defaultLimit: number;
  defaultTtl: number;
};

const DEFAULT_TTL = 60_000;

function readNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function createThrottleDecorator(policy: ThrottlePolicy) {
  return Throttle({
    default: {
      limit: () => readNumberEnv(policy.limitEnv, policy.defaultLimit),
      ttl: () => readNumberEnv(policy.ttlEnv, policy.defaultTtl),
    },
  });
}

export function StrictAuthThrottle() {
  return createThrottleDecorator({
    limitEnv: 'AUTH_THROTTLE_LIMIT',
    ttlEnv: 'AUTH_THROTTLE_TTL',
    defaultLimit: 5,
    defaultTtl: DEFAULT_TTL,
  });
}

export function RefreshTokenThrottle() {
  return createThrottleDecorator({
    limitEnv: 'AUTH_REFRESH_THROTTLE_LIMIT',
    ttlEnv: 'AUTH_REFRESH_THROTTLE_TTL',
    defaultLimit: 20,
    defaultTtl: DEFAULT_TTL,
  });
}

export function ReadApiThrottle() {
  return createThrottleDecorator({
    limitEnv: 'READ_API_THROTTLE_LIMIT',
    ttlEnv: 'READ_API_THROTTLE_TTL',
    defaultLimit: 60,
    defaultTtl: DEFAULT_TTL,
  });
}
