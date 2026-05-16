# Event-Driven Architecture - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết kiến trúc event-driven cho hệ thống, bao gồm event definitions, patterns, và implementation.

---

# 1. Event Architecture Overview

# 1.1 Why Event-Driven?

Benefits:

- **Decoupling**: Services/modules don't depend on each other directly
- **Scalability**: Events can be processed asynchronously
- **Auditability**: Complete history of system events
- **Reactivity**: Real-time updates across the system
- **Extensibility**: Easy to add new consumers

---

# 1.2 Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Domain Action                            │
│                     (User Action / System)                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                         Event Emitter                            │
│               (Service that triggers the event)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                         Event Bus                                │
│              (Central event distribution system)                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
┌───────────▼───┐   ┌─────────▼───┐   ┌─────────▼───┐
│   Consumer 1   │   │   Consumer 2   │   │   Consumer 3   │
│  (Analytics)   │   │   (Streak)    │   │  (Notif/SMS)   │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

# 2. Domain Events

# 2.1 Event Categories

# Authentication Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `auth.registered` | User registration | New user account created |
| `auth.logged_in` | User login | User successfully logged in |
| `auth.login_failed` | Failed login | Login attempt failed |
| `auth.logged_out` | User logout | User logged out |
| `auth.token_refreshed` | Token refresh | Access token refreshed |
| `auth.password_reset_requested` | Password reset | Password reset requested |
| `auth.password_reset_completed` | Password reset | Password successfully reset |
| `auth.email_verified` | Email verification | Email verified |

---

# User Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `user.profile_updated` | Profile change | User updated profile |
| `user.avatar_changed` | Avatar change | User changed avatar |
| `user.role_changed` | Role update | User role was modified |
| `user.deleted` | Account deletion | User account deleted |

---

# Learning Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `vocabulary.created` | Create vocab | New vocabulary added |
| `vocabulary.updated` | Update vocab | Vocabulary modified |
| `vocabulary.deleted` | Delete vocab | Vocabulary removed |
| `vocabulary.bookmarked` | Bookmark | User bookmarked vocab |
| `vocabulary.unbookmarked` | Unbookmark | User removed bookmark |

---

# Flashcard Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `flashcard.review_started` | Review start | User started review session |
| `flashcard.reviewed` | Card reviewed | User reviewed a flashcard |
| `flashcard.review_completed` | Session end | User completed review session |
| `flashcard.mastered` | Mastered | Card marked as mastered |
| `flashcard.forgotten` | Forgotten | Card forgotten after mastery |

---

# Quiz Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `quiz.started` | Quiz start | User started a quiz |
| `quiz.completed` | Quiz end | User completed a quiz |
| `quiz.abandoned` | Quiz quit | User abandoned quiz |
| `quiz.question_answered` | Answer | User answered a question |
| `quiz.passed` | Pass | User passed quiz |
| `quiz.failed` | Fail | User failed quiz |

---

# Progress Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `progress.xp_earned` | XP gain | User earned XP |
| `progress.level_up` | Level up | User leveled up |
| `progress.streak_updated` | Streak | Streak count changed |
| `progress.streak_broken` | Streak | Streak was broken |
| `progress.achievement_unlocked` | Achievement | User unlocked achievement |

---

# Speaking Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `speaking.practice_started` | Practice start | User started speaking practice |
| `speaking.completed` | Practice end | User completed speaking practice |
| `speaking.feedback_received` | Feedback | AI feedback received |

---

# Admin Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `admin.user_banned` | Ban | User was banned |
| `admin.user_unbanned` | Unban | User was unbanned |
| `admin.content_created` | Create | Admin created content |
| `admin.content_deleted` | Delete | Admin deleted content |
| `admin.settings_changed` | Settings | System settings changed |

---

# 3. Event Structure

# 3.1 Base Event Interface

```typescript
interface DomainEvent {
  id: string;              // Unique event ID
  event: string;           // Event name (e.g., "flashcard.reviewed")
  version: string;         // Event schema version
  timestamp: Date;         // When event occurred
  correlationId?: string;  // For tracing related events
  causationId?: string;   // What caused this event
}

interface UserEvent extends DomainEvent {
  userId: string;          // User who triggered the event
  actorId?: string;       // If action done by another user (admin)
}

interface ResourceEvent extends UserEvent {
  resourceId: string;     // ID of affected resource
  resourceType: string;   // Type of resource
}
```

---

# 3.2 Event Examples

# Flashcard Reviewed Event

```typescript
interface FlashcardReviewedEvent extends ResourceEvent {
  event: 'flashcard.reviewed';
  payload: {
    flashcardId: string;
    result: 'again' | 'hard' | 'good' | 'easy';
    previousInterval: number;
    newInterval: number;
    easeFactor: number;
    xpEarned: number;
    timeSpent: number;     // milliseconds
  };
}

// Example
const event: FlashcardReviewedEvent = {
  id: 'evt_123e4567-e89b-12d3-a456-426614174000',
  event: 'flashcard.reviewed',
  version: '1.0',
  timestamp: new Date('2024-01-01T10:30:00Z'),
  correlationId: 'req_abc123',
  userId: 'usr_123e4567-e89b-12d3-a456-426614174000',
  actorId: 'usr_123e4567-e89b-12d3-a456-426614174000',
  resourceId: 'fcrd_123e4567-e89b-12d3-a456-426614174000',
  resourceType: 'flashcard',
  payload: {
    flashcardId: 'fcrd_123e4567-e89b-12d3-a456-426614174000',
    result: 'good',
    previousInterval: 1,
    newInterval: 4,
    easeFactor: 2.6,
    xpEarned: 10,
    timeSpent: 3000,
  },
};
```

---

# Quiz Completed Event

```typescript
interface QuizCompletedEvent extends ResourceEvent {
  event: 'quiz.completed';
  payload: {
    quizId: string;
    attemptId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSpent: number;     // seconds
    passed: boolean;
    xpEarned: number;
  };
}
```

---

# Level Up Event

```typescript
interface LevelUpEvent extends UserEvent {
  event: 'progress.level_up';
  payload: {
    previousLevel: number;
    newLevel: number;
    totalXp: number;
    xpToNextLevel: number;
  };
}
```

---

# 4. Event Implementation

# 4.1 Event Emitter Service

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitter {
  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  emit<T extends DomainEvent>(event: T): void {
    this.eventEmitter.emit(event.event, event);
  }

  emitAsync<T extends DomainEvent>(event: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventEmitter.emit(event.event, event, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

---

# 4.2 Event Creation Helper

```typescript
import { v4 as uuid } from 'uuid';

function createEvent<T extends DomainEvent['event']>(
  event: T,
  data: Omit<Extract<DomainEvent, { event: T }>, 'id' | 'event' | 'version' | 'timestamp'>
): Extract<DomainEvent, { event: T }> {
  return {
    id: uuid(),
    event,
    version: '1.0',
    timestamp: new Date(),
    ...data,
  } as Extract<DomainEvent, { event: T }>;
}

// Usage
const event = createEvent('flashcard.reviewed', {
  userId: 'user-123',
  resourceId: 'flashcard-456',
  payload: {
    flashcardId: 'flashcard-456',
    result: 'good',
    previousInterval: 1,
    newInterval: 4,
    easeFactor: 2.6,
    xpEarned: 10,
    timeSpent: 3000,
  },
});
```

---

# 5. Event Consumers

# 5.1 Analytics Consumer

```typescript
@Injectable()
export class AnalyticsEventConsumer {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @OnEvent('flashcard.reviewed')
  async handleFlashcardReviewed(event: FlashcardReviewedEvent) {
    await this.analyticsService.trackEvent({
      userId: event.userId,
      event: 'flashcard_reviewed',
      properties: {
        result: event.payload.result,
        xpEarned: event.payload.xpEarned,
        timeSpent: event.payload.timeSpent,
      },
    });

    // Update daily stats
    await this.analyticsService.updateDailyStats(event.userId, {
      flashcardsReviewed: 1,
      xpEarned: event.payload.xpEarned,
    });
  }

  @OnEvent('quiz.completed')
  async handleQuizCompleted(event: QuizCompletedEvent) {
    await this.analyticsService.trackEvent({
      userId: event.userId,
      event: 'quiz_completed',
      properties: {
        quizId: event.payload.quizId,
        score: event.payload.score,
        passed: event.payload.passed,
        timeSpent: event.payload.timeSpent,
      },
    });
  }
}
```

---

# 5.2 Streak Consumer

```typescript
@Injectable()
export class StreakEventConsumer {
  constructor(
    private readonly streakService: StreakService,
  ) {}

  @OnEvent('flashcard.reviewed')
  @OnEvent('quiz.completed')
  @OnEvent('speaking.completed')
  async handleLearningActivity(event: UserEvent) {
    const updated = await this.streakService.incrementStreak(event.userId);

    if (updated.broken) {
      // Emit streak broken event
    }
  }

  @OnEvent('progress.streak_updated')
  async handleStreakUpdated(event: StreakUpdatedEvent) {
    if (event.payload.newStreak >= 7 && event.payload.newStreak % 7 === 0) {
      // Weekly milestone notification
    }
  }
}
```

---

# 5.3 Notification Consumer

```typescript
@Injectable()
export class NotificationEventConsumer {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('progress.level_up')
  async handleLevelUp(event: LevelUpEvent) {
    await this.notificationService.create({
      userId: event.userId,
      type: 'achievement',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${event.payload.newLevel}!`,
      data: {
        newLevel: event.payload.newLevel,
      },
    });
  }

  @OnEvent('progress.achievement_unlocked')
  async handleAchievementUnlocked(event: AchievementUnlockedEvent) {
    await this.notificationService.create({
      userId: event.userId,
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You've unlocked: ${event.payload.achievementName}`,
    });
  }

  @OnEvent('progress.streak_broken')
  async handleStreakBroken(event: StreakBrokenEvent) {
    await this.notificationService.create({
      userId: event.userId,
      type: 'reminder',
      title: 'Streak Broken',
      message: 'Your learning streak has been broken. Start a new one today!',
    });
  }
}
```

---

# 5.4 Recommendation Consumer

```typescript
@Injectable()
export class RecommendationEventConsumer {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @OnEvent('flashcard.reviewed')
  async handleFlashcardReviewed(event: FlashcardReviewedEvent) {
    // Update user's learning pattern
    await this.recommendationService.updateLearningPattern(event.userId, {
      topic: 'flashcard',
      difficulty: event.payload.result === 'again' ? 'hard' : 'easy',
    });

    // If struggling, recommend more practice
    if (event.payload.result === 'again') {
      await this.recommendationService.addRecommendation(event.userId, {
        type: 'practice',
        reason: 'Improving weak areas',
        priority: 'high',
      });
    }
  }

  @OnEvent('quiz.completed')
  async handleQuizCompleted(event: QuizCompletedEvent) {
    // Analyze weak topics
    const weakTopics = await this.analyzeWeakTopics(event.userId, event.payload.quizId);

    for (const topic of weakTopics) {
      await this.recommendationService.addRecommendation(event.userId, {
        type: 'vocabulary',
        targetId: topic.id,
        reason: 'Weak area detected',
        priority: 'medium',
      });
    }
  }
}
```

---

# 5.5 Achievement Consumer

```typescript
@Injectable()
export class AchievementEventConsumer {
  constructor(
    private readonly achievementService: AchievementService,
  ) {}

  @OnEvent('flashcard.reviewed')
  async checkFlashcardAchievements(event: FlashcardReviewedEvent) {
    const achievements = await this.achievementService.checkAndUnlock(event.userId, [
      { type: 'flashcards_reviewed', threshold: 100 },
      { type: 'streak', threshold: 7 },
      { type: 'perfect_session', threshold: 20 },
    ]);
  }

  @OnEvent('quiz.passed')
  async checkQuizAchievements(event: QuizCompletedEvent) {
    if (event.payload.passed) {
      await this.achievementService.checkAndUnlock(event.userId, [
        { type: 'quizzes_passed', threshold: 10 },
        { type: 'perfect_score', threshold: 1 },
      ]);
    }
  }
}
```

---

# 6. Queue Integration

# 6.1 BullMQ Event Queue

```typescript
// Event Queue Processor
@Processor('event-queue')
export class EventQueueProcessor {
  constructor(
    private readonly analyticsConsumer: AnalyticsEventConsumer,
    private readonly streakConsumer: StreakEventConsumer,
    private readonly notificationConsumer: NotificationEventConsumer,
  ) {}

  @Process()
  async processEvent(job: Job<DomainEvent>) {
    const event = job.data;

    switch (event.event) {
      case 'flashcard.reviewed':
        await this.analyticsConsumer.handleFlashcardReviewed(event);
        await this.streakConsumer.handleLearningActivity(event);
        break;

      case 'quiz.completed':
        await this.analyticsConsumer.handleQuizCompleted(event);
        await this.streakConsumer.handleLearningActivity(event);
        break;

      // Add more cases...
    }
  }
}
```

---

# 6.2 Event Publishing to Queue

```typescript
@Injectable()
export class EventPublisher {
  constructor(
    private readonly eventQueue: InjectQueue('event-queue'),
  ) {}

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.eventQueue.add('process-event', event, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
```

---

# 7. Event Storage

# 7.1 Event Store Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(255),
  payload JSONB NOT NULL,
  metadata JSONB,
  correlation_id UUID,
  causation_id UUID,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_aggregate ON events(aggregate_id, aggregate_type);
CREATE INDEX idx_events_correlation ON events(correlation_id);
CREATE INDEX idx_events_created ON events(created_at);
```

---

# 7.2 Event Store Service

```typescript
@Injectable()
export class EventStore {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async append<T extends DomainEvent>(event: T): Promise<void> {
    await this.prisma.event.create({
      data: {
        id: event.id,
        eventType: event.event,
        aggregateId: (event as any).resourceId || (event as any).userId,
        aggregateType: (event as any).resourceType || 'user',
        payload: event.payload,
        metadata: {
          version: event.version,
          correlationId: event.correlationId,
          causationId: event.causationId,
        },
        correlationId: event.correlationId,
        causationId: event.causationId,
      },
    });
  }

  async getByCorrelationId(correlationId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { correlationId },
      orderBy: { createdAt: 'asc' },
    });

    return events.map(this.mapToEvent);
  }
}
```

---

# 8. CQRS Pattern

# 8.1 Command vs Query

```
┌─────────────────────────────────────────────────────────────────┐
│                         Commands                                 │
│           (Write - Change state)                               │
│                                                                 │
│  createVocabulary                                               │
│  updateVocabulary                                               │
│  reviewFlashcard                                                │
│  submitQuiz                                                     │
│  updateProfile                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Events
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Event Bus                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Read Model   │ │    Analytics    │ │   Notifications │
│   (Projected)   │ │     Store       │ │     Store       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Queries                                 │
│             (Read - No state change)                            │
│                                                                 │
│  getVocabulary                                                   │
│  getLeaderboard                                                  │
│  getUserStats                                                    │
│  getNotifications                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

# 9. Event Schema Versioning

# 9.1 Schema Evolution

```typescript
// Event versioning
interface FlashcardReviewedEventV2 extends FlashcardReviewedEvent {
  version: '2.0';
  payload: {
    // ... V1 payload
    newFeature: string;  // New field added
  };
}

// Upcaster - transform old events to new version
@Injectable()
export class EventUpcaster {
  upcast(event: DomainEvent): DomainEvent {
    if (event.version === '1.0' && event.event === 'flashcard.reviewed') {
      return {
        ...event,
        version: '2.0',
        payload: {
          ...event.payload,
          newFeature: 'default_value',
        },
      };
    }
    return event;
  }
}
```

---

# 10. Testing Events

# 10.1 Unit Test Example

```typescript
describe('FlashcardReviewedEvent', () => {
  it('should create event with correct structure', () => {
    const event = createEvent('flashcard.reviewed', {
      userId: 'user-123',
      resourceId: 'flashcard-456',
      payload: {
        flashcardId: 'flashcard-456',
        result: 'good',
        previousInterval: 1,
        newInterval: 4,
        easeFactor: 2.6,
        xpEarned: 10,
        timeSpent: 3000,
      },
    });

    expect(event.id).toBeDefined();
    expect(event.event).toBe('flashcard.reviewed');
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.payload.result).toBe('good');
  });
});
```

---

# 11. Best Practices

# Naming Convention

```
{resource}.{action}

Examples:
- flashcard.reviewed
- quiz.completed
- user.profile_updated
```

# Event Design Rules

- Events describe what happened, not what to do
- Include all relevant data in payload
- Use past tense for event names
- Include timestamp
- Use UUIDs for IDs
- Version events for compatibility

---

# 12. Checklist

- [x] Event definitions
- [x] Event structure
- [x] Event emitter service
- [x] Consumer patterns
- [x] Queue integration
- [x] Event storage
- [ ] CQRS implementation
- [ ] Event replay
- [ ] Event versioning
- [ ] Testing

---

# 13. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
