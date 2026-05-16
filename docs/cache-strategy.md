# Cache Strategy - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết chiến lược cache cho hệ thống, bao gồm layers, invalidation patterns, và best practices.

---

# 1. Cache Architecture Overview

# 1.1 Multi-Layer Cache

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│                   (Browser Cache)                           │
│                    TTL: 5 minutes                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     L1 Cache                               │
│                 (In-Memory Cache)                           │
│                  TTL: 30 seconds                           │
│               For: Hot data, session                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     L2 Cache                               │
│                    (Redis)                                 │
│                  TTL: varies                                │
│         For: User data, sessions, permissions               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     L3 Cache                               │
│                     (CDN)                                  │
│                  TTL: 1 day                                │
│             For: Static assets, images                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      Database                              │
│              (PostgreSQL - Source of Truth)                │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. Cache Layers Detail

# 2.1 L1 - In-Memory Cache

# Implementation

```typescript
import NodeCache from 'node-cache';

// Application-level cache
const appCache = new NodeCache({
  stdTTL: 30,        // 30 seconds default
  checkperiod: 60,   // Check for expired keys every 60 seconds
  useClones: false,  // Store references for better performance
});

// Usage
appCache.set('hot-data', data, 30);
const data = appCache.get('hot-data');
```

# Use Cases

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Current user session | 30s | Frequent access, low staleness tolerance |
| Permission cache | 30s | Must reflect changes quickly |
| Rate limit counters | 60s | Short-lived by nature |
| Active requests count | 30s | Real-time accuracy needed |

---

# 2.2 L2 - Redis Cache

# Redis Configuration

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'elp:',
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});
```

# Connection Pooling

```typescript
import { Redis } from 'ioredis';

const pool = {
  default: new Redis({ /* config */ }),
  cache: new Redis({ /* config */ }),
  session: new Redis({ /* config */ }),
  rateLimit: new Redis({ /* config */ }),
};
```

---

# 2.3 L3 - CDN Cache

# CDN Configuration

```typescript
// Cloudflare/CDN settings
const cdnConfig = {
  staticAssets: {
    pattern: '/(images|audio|video)/.*',
    ttl: 86400,           // 1 day
    staleWhileRevalidate: 3600,
  },
  apiResponses: {
    pattern: '/api/v1/public/*',
    ttl: 300,             // 5 minutes
    bypass: true,          // Allow cache bypass
  },
  dynamicContent: {
    pattern: '/api/v1/*',
    ttl: 0,               // No cache
    bypass: true,
  },
};
```

---

# 3. Cache Key Naming Convention

# 3.1 Key Structure

```txt
{prefix}:{module}:{resource}:{id}:{variant}
```

# Key Components

| Component | Description | Example |
|-----------|-------------|---------|
| prefix | Project prefix | `elp` |
| module | Module name | `user`, `flashcard`, `quiz` |
| resource | Resource type | `profile`, `stats`, `list` |
| id | Resource ID | `uuid`, `user_id` |
| variant | Additional qualifier | `weekly`, `monthly` |

# Examples

```txt
elp:user:profile:123e4567-e89b-12d3-a456-426614174000
elp:flashcard:due:user:123e4567-e89b-12d3-a456-426614174000
elp:vocabulary:list:topic:toeic
elp:leaderboard:global:weekly
elp:quiz:stats:123e4567-e89b-12d3-a456-426614174000
elp:permission:user:123e4567-e89b-12d3-a456-426614174000
elp:session:123e4567-e89b-12d3-a456-426614174000
```

---

# 4. Cache TTL Strategy

# 4.1 TTL by Data Type

| Data Type | TTL | Invalidation Trigger |
|-----------|-----|--------------------|
| User profile | 10 minutes | User update |
| User permissions | 5 minutes | Role/permission change |
| Session data | 7 days | Logout/revoke |
| Flashcard due list | 1 minute | Card review |
| Flashcard stats | 5 minutes | Review activity |
| Vocabulary list | 5 minutes | Vocabulary CRUD |
| Vocabulary detail | 10 minutes | Update vocabulary |
| Quiz detail | 15 minutes | Quiz update |
| Quiz questions | 15 minutes | Quiz update |
| Leaderboard | 5 minutes | Hourly job |
| Grammar lesson | 1 hour | Update grammar |
| Topic list | 30 minutes | Topic CRUD |
| Progress stats | 5 minutes | Learning activity |
| Rate limit counter | 1 minute | Window reset |

---

# 4.2 TTL Configuration

```typescript
const CACHE_TTL = {
  // User
  USER_PROFILE: 60 * 10,           // 10 minutes
  USER_STATS: 60 * 5,              // 5 minutes
  USER_PERMISSIONS: 60 * 5,        // 5 minutes

  // Learning
  FLASHCARD_DUE: 60,               // 1 minute
  FLASHCARD_STATS: 60 * 5,         // 5 minutes
  VOCABULARY_LIST: 60 * 5,         // 5 minutes
  VOCABULARY_DETAIL: 60 * 10,      // 10 minutes
  QUIZ_DETAIL: 60 * 15,           // 15 minutes

  // System
  LEADERBOARD: 60 * 5,             // 5 minutes
  TOPIC_LIST: 60 * 30,             // 30 minutes
  GRAMMAR_LESSON: 60 * 60,         // 1 hour

  // Progress
  PROGRESS_STATS: 60 * 5,          // 5 minutes
  ACHIEVEMENTS: 60 * 10,           // 10 minutes

  // Session
  SESSION: 60 * 60 * 24 * 7,      // 7 days
  REFRESH_TOKEN: 60 * 60 * 24 * 30, // 30 days

  // Rate Limit
  RATE_LIMIT: 60,                  // 1 minute
};
```

---

# 5. Cache Operations

# 5.1 Basic Operations

```typescript
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(data));
  }

  async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  }
}
```

---

# 5.2 Pattern-based Operations

```typescript
class CacheService {
  // Delete all keys matching a pattern
  async deletePattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    // Remove prefix added by ioredis
    const keysWithoutPrefix = keys.map(k => k.replace('elp:', ''));
    return await redis.del(...keysWithoutPrefix);
  }

  // Example usage
  async invalidateUserCache(userId: string) {
    await this.deletePattern(`user:*:${userId}`);
    await this.deletePattern(`permission:*:${userId}`);
  }
}
```

---

# 5.3 Hash Operations

```typescript
class CacheService {
  // Cache user session data
  async setUserSession(sessionId: string, data: SessionData) {
    await redis.hset(`session:${sessionId}`, {
      userId: data.userId,
      createdAt: data.createdAt.toISOString(),
      data: JSON.stringify(data),
    });
    await redis.expire(`session:${sessionId}`, CACHE_TTL.SESSION);
  }

  async getUserSession(sessionId: string) {
    const data = await redis.hget(`session:${sessionId}`, 'data');
    return data ? JSON.parse(data) : null;
  }

  async deleteUserSession(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  }
}
```

---

# 5.4 List Operations

```typescript
class CacheService {
  // Cache due flashcards (ordered by due date)
  async setDueFlashcards(userId: string, cards: Flashcard[]) {
    const key = `flashcard:due:user:${userId}`;
    const values = cards.map(c => JSON.stringify(c));

    await redis.del(key);
    if (values.length > 0) {
      await redis.rpush(key, ...values);
      await redis.expire(key, CACHE_TTL.FLASHCARD_DUE);
    }
  }

  async getDueFlashcards(userId: string): Promise<Flashcard[]> {
    const key = `flashcard:due:user:${userId}`;
    const data = await redis.lrange(key, 0, -1);
    return data.map(d => JSON.parse(d));
  }
}
```

---

# 6. Cache Invalidation Strategies

# 6.1 Write-through Cache

```typescript
async updateVocabulary(id: string, data: UpdateVocabularyDto) {
  // 1. Update database
  const updated = await this.prisma.vocabulary.update({
    where: { id },
    data,
  });

  // 2. Update cache
  await this.cacheService.set(
    `vocabulary:detail:${id}`,
    updated,
    CACHE_TTL.VOCABULARY_DETAIL
  );

  // 3. Invalidate list caches
  await this.cacheService.deletePattern(`vocabulary:list:*`);

  return updated;
}
```

---

# 6.2 Write-behind Cache (Cache-aside)

```typescript
async getVocabulary(id: string) {
  // 1. Try cache first
  const cached = await this.cacheService.get<Vocabulary>(
    `vocabulary:detail:${id}`
  );
  if (cached) return cached;

  // 2. Cache miss - fetch from DB
  const vocabulary = await this.prisma.vocabulary.findUnique({
    where: { id },
  });

  if (vocabulary) {
    // 3. Store in cache
    await this.cacheService.set(
      `vocabulary:detail:${id}`,
      vocabulary,
      CACHE_TTL.VOCABULARY_DETAIL
    );
  }

  return vocabulary;
}
```

---

# 6.3 Event-based Invalidation

```typescript
// Event handler for vocabulary updates
@OnEvent('vocabulary.updated')
async handleVocabularyUpdate(payload: VocabularyUpdatedEvent) {
  const { vocabularyId, topicId } = payload;

  // Invalidate detail cache
  await this.cacheService.delete(`vocabulary:detail:${vocabularyId}`);

  // Invalidate topic list cache
  await this.cacheService.delete(`vocabulary:list:topic:${topicId}`);

  // Invalidate homepage recommendations
  await this.cacheService.deletePattern(`recommendation:*`);
}
```

---

# 6.4 Cascade Invalidation

```typescript
class CacheInvalidationService {
  // When topic is updated, invalidate related caches
  async invalidateTopic(topicId: string) {
    const invalidations = [
      `topic:detail:${topicId}`,
      `topic:list`,
      `vocabulary:list:topic:${topicId}`,
      `course:detail:*`, // If topic is part of course
      `recommendation:*`,
    ];

    for (const pattern of invalidations) {
      if (pattern.includes('*')) {
        await this.cacheService.deletePattern(pattern);
      } else {
        await this.cacheService.delete(pattern);
      }
    }
  }

  // When user role changes, invalidate permissions
  async invalidateUserPermissions(userId: string) {
    await Promise.all([
      this.cacheService.delete(`permission:user:${userId}`),
      this.cacheService.delete(`session:${userId}`),
    ]);
  }
}
```

---

# 7. Specific Cache Patterns

# 7.1 User Profile Cache

```typescript
async getUserProfile(userId: string) {
  const cacheKey = `user:profile:${userId}`;

  // Try cache
  const cached = await this.cacheService.get<UserProfile>(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      xp: true,
      streakDays: true,
      level: true,
    },
  });

  if (!user) return null;

  // Cache for 10 minutes
  await this.cacheService.set(cacheKey, user, CACHE_TTL.USER_PROFILE);

  return user;
}

async updateUserProfile(userId: string, data: UpdateProfileDto) {
  // Update database
  const updated = await this.prisma.user.update({
    where: { id: userId },
    data,
  });

  // Invalidate cache
  await this.cacheService.delete(`user:profile:${userId}`);
  await this.cacheService.delete(`user:stats:${userId}`);

  return updated;
}
```

---

# 7.2 Permission Cache

```typescript
async getUserPermissions(userId: string) {
  const cacheKey = `permission:user:${userId}`;

  const cached = await this.cacheService.get<string[]>(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const permissions = await this.prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissionCodes = permissions
    .flatMap(ur => ur.role.rolePermissions)
    .map(rp => rp.permission.code);

  // Cache for 5 minutes
  await this.cacheService.set(cacheKey, permissionCodes, CACHE_TTL.USER_PERMISSIONS);

  return permissionCodes;
}

async invalidateUserPermissions(userId: string) {
  await this.cacheService.delete(`permission:user:${userId}`);
}

// Called when role/permission changes
@OnEvent('role.permission_changed')
async handlePermissionChange(payload: RolePermissionChangedEvent) {
  await this.invalidateUserPermissions(payload.userId);
}
```

---

# 7.3 Leaderboard Cache

```typescript
async getLeaderboard(period: 'daily' | 'weekly' | 'monthly', limit: number = 100) {
  const cacheKey = `leaderboard:${period}`;

  const cached = await this.cacheService.get<LeaderboardEntry[]>(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  // Calculate from database
  const startDate = this.getStartDate(period);

  const leaderboard = await this.prisma.user.findMany({
    where: {
      xpHistory: {
        some: {
          createdAt: { gte: startDate },
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      xp: true,
      level: true,
    },
    orderBy: { xp: 'desc' },
    take: limit,
  });

  // Cache for 5 minutes (will be refreshed by cron job)
  await this.cacheService.set(cacheKey, leaderboard, CACHE_TTL.LEADERBOARD);

  return leaderboard;
}
```

---

# 7.4 Flashcard Due Cache

```typescript
async getDueFlashcards(userId: string, limit: number = 20) {
  const cacheKey = `flashcard:due:user:${userId}`;

  // Get from cache (stored as list)
  const cached = await this.cacheService.getDueFlashcards(userId);
  if (cached && cached.length > 0) {
    return cached.slice(0, limit);
  }

  // Calculate due cards from database
  const dueCards = await this.prisma.userFlashcardReview.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
    },
    include: {
      flashcard: {
        include: {
          vocabulary: true,
        },
      },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: limit,
  });

  const cards = dueCards.map(ucr => ({
    id: ucr.id,
    flashcardId: ucr.flashcardId,
    frontContent: ucr.flashcard.frontContent,
    backContent: ucr.flashcard.backContent,
    audioUrl: ucr.flashcard.audioUrl,
    vocabulary: ucr.flashcard.vocabulary,
  }));

  // Cache for 1 minute
  await this.cacheService.setDueFlashcards(userId, cards);

  return cards;
}

// Invalidate after review
async reviewFlashcard(userId: string, flashcardId: string, result: string) {
  // Update database
  const updated = await this.updateFlashcardReview(userId, flashcardId, result);

  // Invalidate due list cache
  await this.cacheService.delete(`flashcard:due:user:${userId}`);
  await this.cacheService.delete(`flashcard:stats:user:${userId}`);

  return updated;
}
```

---

# 8. Cache Monitoring

# 8.1 Metrics to Track

```typescript
// Cache hit rate
const hitRate = {
  userProfile: await trackHitRate('user:profile:*'),
  permissions: await trackHitRate('permission:user:*'),
  leaderboard: await trackHitRate('leaderboard:*'),
};

// Hit rate calculation
async function trackHitRate(pattern: string) {
  const keys = await redis.keys(pattern);
  const samples = keys.slice(0, 100);

  let hits = 0;
  for (const key of samples) {
    const exists = await redis.exists(key);
    if (exists) hits++;
  }

  return hits / samples.length;
}
```

# 8.2 Cache Statistics

```typescript
async getCacheStats() {
  const info = await redis.info('stats');

  return {
    hits: parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0'),
    misses: parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0'),
    hitRate: parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') /
             (parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') +
              parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0')) * 100,
    memoryUsed: info.match(/used_memory:(\d+)/)?.[1],
    connectedClients: info.match(/connected_clients:(\d+)/)?.[1],
  };
}
```

---

# 9. Best Practices

# Do

- Always set appropriate TTLs
- Use consistent key naming convention
- Implement cache invalidation on writes
- Monitor cache hit rates
- Handle cache failures gracefully
- Use cache for read-heavy, write-less data
- Implement circuit breaker for Redis failures

# Don't

- Cache sensitive data without encryption
- Set very long TTLs without invalidation
- Cache unlimited data (use max memory)
- Trust cache as source of truth
- Skip cache invalidation on updates
- Use cache for real-time critical data
- Cache entire large objects

---

# 10. Troubleshooting

# Cache Stampede

```typescript
// Prevent cache stampede with mutex
async getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await this.cacheService.get<T>(key);
  if (cached) return cached;

  // Lock to prevent stampede
  const lockKey = `lock:${key}`;
  const lockAcquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (!lockAcquired) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getOrSet(key, factory, ttl);
  }

  try {
    const data = await factory();
    await this.cacheService.set(key, data, ttl);
    return data;
  } finally {
    await redis.del(lockKey);
  }
}
```

# Redis Failure Handling

```typescript
class CircuitBreakerCache {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async get<T>(key: string): Promise<T | null> {
    if (this.isOpen()) {
      return null; // Fail fast
    }

    try {
      const result = await redis.get(key);
      this.failures = 0;
      return result ? JSON.parse(result) : null;
    } catch (error) {
      this.recordFailure();
      return null;
    }
  }

  private isOpen() {
    if (this.failures >= this.threshold) {
      return Date.now() - this.lastFailure < this.resetTimeout;
    }
    return false;
  }

  private recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }
}
```

---

# 11. Checklist

- [x] Redis configuration
- [x] Cache key naming convention
- [x] TTL strategy
- [x] Basic cache operations
- [x] Invalidation strategies
- [ ] Cache monitoring
- [ ] Cache hit rate tracking
- [ ] Circuit breaker implementation
- [ ] Cache stampede prevention
- [ ] Performance testing

---

# 12. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
