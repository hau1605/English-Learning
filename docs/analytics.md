# Analytics Architecture - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết kiến trúc analytics cho hệ thống, bao gồm event tracking, metrics collection, và reporting.

---

# 1. Analytics Overview

# 1.1 Why Analytics?

Benefits:

- **User Understanding**: Know how users learn
- **Product Insights**: Identify popular features
- **Performance Metrics**: Track system health
- **Business Decisions**: Data-driven choices
- **Retention**: Understand churn patterns
- **Optimization**: Improve user experience

---

# 1.2 Analytics Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Actions                                 │
│         (Flashcard review, Quiz, Speaking, etc.)                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       Event Tracking                              │
│                    (Frontend + Backend)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       Event Queue                                │
│                    (BullMQ / Kafka)                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   Analytics Workers                              │
│              (Event Processing, Aggregation)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Real-time DB   │ │  Analytics DB   │ │  Data Warehouse │
│   (PostgreSQL)   │ │   (Timescale)   │ │  (Aggregation)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Dashboard     │ │   Reports       │ │   ML Models     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

# 2. Event Tracking

# 2.1 Analytics Events

# Page Events

| Event | Properties | Description |
|-------|------------|-------------|
| `page_view` | page, referrer, duration | User viewed a page |
| `app_open` | platform, version | User opened app |
| `app_close` | duration, session_id | User closed app |

---

# Learning Events

| Event | Properties | Description |
|-------|------------|-------------|
| `flashcard_review_started` | topic_id, card_count | Started flashcard session |
| `flashcard_reviewed` | card_id, result, time_spent | Reviewed a card |
| `flashcard_session_completed` | cards_reviewed, correct_count | Completed session |
| `quiz_started` | quiz_id, question_count | Started quiz |
| `quiz_completed` | quiz_id, score, time_spent | Completed quiz |
| `speaking_practice_started` | exercise_id | Started speaking |
| `speaking_practice_completed` | exercise_id, score, time_spent | Completed speaking |

---

# User Events

| Event | Properties | Description |
|-------|------------|-------------|
| `user_registered` | method (email/social) | User signed up |
| `user_logged_in` | method | User logged in |
| `user_logged_out` | - | User logged out |
| `profile_updated` | fields_changed | User updated profile |
| `settings_changed` | setting_key | User changed settings |

---

# Progress Events

| Event | Properties | Description |
|-------|------------|-------------|
| `xp_earned` | amount, source, total | XP earned |
| `level_up` | new_level | User leveled up |
| `streak_updated` | current_streak, longest_streak | Streak changed |
| `achievement_unlocked` | achievement_id, name | Achievement earned |

---

# 2.2 Event Schema

```typescript
interface AnalyticsEvent {
  id: string;                    // Unique event ID
  event: string;                 // Event name
  userId?: string;               // User ID (if logged in)
  anonymousId?: string;          // Anonymous user ID
  sessionId: string;             // Session ID
  timestamp: Date;               // Event timestamp
  platform: 'web' | 'mobile' | 'desktop';
  appVersion: string;            // App version
  properties: Record<string, any>; // Event-specific properties
  context: {
    ip?: string;
    userAgent?: string;
    language?: string;
    timezone?: string;
    screenWidth?: number;
    screenHeight?: number;
    url?: string;
    referrer?: string;
  };
}
```

---

# 2.3 Event Tracking Implementation

# Frontend Tracking

```typescript
// lib/analytics.ts
import { analytics } from './analytics-client';

class Analytics {
  track(event: string, properties?: Record<string, any>) {
    const eventData = {
      id: uuid(),
      event,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      timestamp: new Date(),
      platform: 'web',
      appVersion: process.env.APP_VERSION,
      properties,
      context: {
        url: window.location.href,
        referrer: document.referrer,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      },
    };

    // Send to server
    fetch('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
      keepalive: true, // Ensure delivery on page unload
    });
  }

  // Convenience methods
  pageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', { page, ...properties });
  }

  flashcardReviewed(result: string, timeSpent: number) {
    this.track('flashcard_reviewed', { result, time_spent: timeSpent });
  }

  quizCompleted(quizId: string, score: number) {
    this.track('quiz_completed', { quiz_id: quizId, score });
  }
}

export const analytics = new Analytics();
```

---

# Backend Event Collection

```typescript
// analytics/analytics.controller.ts
@Post('events')
async collectEvents(
  @Body() events: AnalyticsEvent[],
  @Req() req: Request,
) {
  // Enrich events with server-side data
  const enrichedEvents = events.map(event => ({
    ...event,
    context: {
      ...event.context,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
    },
  }));

  // Add to processing queue
  await this.analyticsQueue.add('process-events', enrichedEvents, {
    attempts: 3,
    removeOnComplete: true,
  });

  return { success: true };
}
```

---

# 3. Analytics Database Schema

# 3.1 Event Store Table

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id),
  anonymous_id VARCHAR(255),
  session_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  app_version VARCHAR(50),
  properties JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_events_user ON analytics_events(user_id);
CREATE INDEX idx_events_session ON analytics_events(session_id);
CREATE INDEX idx_events_event ON analytics_events(event);
CREATE INDEX idx_events_created ON analytics_events(created_at);
CREATE INDEX idx_events_properties ON analytics_events USING GIN(properties);
```

---

# 3.2 Daily Stats Table

```sql
CREATE TABLE user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  xp_earned INT DEFAULT 0,
  words_learned INT DEFAULT 0,
  words_reviewed INT DEFAULT 0,
  flashcards_reviewed INT DEFAULT 0,
  quizzes_completed INT DEFAULT 0,
  speaking_practices INT DEFAULT 0,
  study_minutes INT DEFAULT 0,
  login_count INT DEFAULT 0,
  streak_continued BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_stats_user_date ON user_daily_stats(user_id, date);
CREATE INDEX idx_daily_stats_date ON user_daily_stats(date);
```

---

# 3.3 Learning Metrics Table

```sql
CREATE TABLE learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  metric_type VARCHAR(100) NOT NULL,
  value DECIMAL(10, 4) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Metric types
-- accuracy_rate, retention_rate, avg_time_per_card, completion_rate

CREATE INDEX idx_metrics_user_type ON learning_metrics(user_id, metric_type);
CREATE INDEX idx_metrics_period ON learning_metrics(period_start, period_end);
```

---

# 3.4 User Cohorts Table

```sql
CREATE TABLE user_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_date DATE NOT NULL,
  cohort_type VARCHAR(50) NOT NULL, -- 'registration', 'first_activity'
  user_count INT DEFAULT 0,
  retention_data JSONB DEFAULT '[]', -- day_1, day_7, day_30, etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 4. Metrics Definitions

# 4.1 User Metrics

# Daily Active Users (DAU)

```typescript
async function getDAU(date: Date): Promise<number> {
  const startOfDay = startOfDayLocal(date);
  const endOfDay = endOfDayLocal(date);

  return prisma.analyticsEvents.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
      userId: { not: null },
    },
  }).then(result => result.length);
}
```

---

# Monthly Active Users (MAU)

```typescript
async function getMAU(month: Date): Promise<number> {
  const startOfMonth = startOfMonthLocal(month);
  const endOfMonth = endOfMonthLocal(month);

  return prisma.analyticsEvents.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startOfMonth, lt: endOfMonth },
      userId: { not: null },
    },
  }).then(result => result.length);
}
```

---

# Retention Rate

```typescript
interface RetentionData {
  day: number;
  retainedUsers: number;
  retentionRate: number;
}

async function calculateRetention(cohortDate: Date): Promise<RetentionData[]> {
  const results: RetentionData[] = [];
  const day0Users = await getDay0Users(cohortDate);

  for (const day of [1, 7, 14, 30, 60, 90]) {
    const targetDate = addDays(cohortDate, day);
    const retainedUsers = await countUsersActiveOnDate(day0Users, targetDate);

    results.push({
      day,
      retainedUsers,
      retentionRate: day0Users.length > 0
        ? (retainedUsers / day0Users.length) * 100
        : 0,
    });
  }

  return results;
}
```

---

# 4.2 Learning Metrics

# Quiz Accuracy

```typescript
async function getQuizAccuracy(userId: string, period: DateRange): Promise<number> {
  const attempts = await prisma.userQuizAttempt.findMany({
    where: {
      userId,
      completedAt: { gte: period.start, lt: period.end },
    },
    select: {
      correctCount: true,
      totalQuestions: true,
    },
  });

  const totalCorrect = attempts.reduce((sum, a) => sum + a.correctCount, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

  return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
}
```

---

# Flashcard Retention

```typescript
async function getFlashcardRetention(userId: string): Promise<number> {
  const stats = await prisma.userFlashcardReview.aggregate({
    where: { userId },
    _sum: {
      correctStreak: true,
      wrongCount: true,
    },
  });

  const correctStreak = stats._sum.correctStreak || 0;
  const wrongCount = stats._sum.wrongCount || 0;
  const total = correctStreak + wrongCount;

  return total > 0 ? (correctStreak / total) * 100 : 0;
}
```

---

# Average Study Time

```typescript
async function getAverageStudyTime(userId: string, period: DateRange): Promise<number> {
  const stats = await prisma.userDailyStats.aggregate({
    where: {
      userId,
      date: { gte: period.start, lt: period.end },
    },
    _avg: {
      studyMinutes: true,
    },
  });

  return stats._avg.studyMinutes || 0;
}
```

---

# 5. Analytics Dashboard

# 5.1 Key Metrics Dashboard

# User Metrics

```typescript
interface UserDashboardMetrics {
  // Current period
  dau: number;
  mau: number;
  newUsers: number;

  // Comparison with previous period
  dauChange: number;
  mauChange: number;
  newUsersChange: number;

  // Retention
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
}
```

---

# Learning Metrics

```typescript
interface LearningDashboardMetrics {
  // Activity
  totalFlashcardsReviewed: number;
  totalQuizzesCompleted: number;
  totalSpeakingPractices: number;

  // Performance
  averageAccuracy: number;
  averageRetention: number;
  averageStudyMinutes: number;

  // Trends
  weeklyActivityChange: number;
  monthlyAccuracyChange: number;
}
```

---

# 5.2 Dashboard API

```typescript
// GET /api/analytics/dashboard
interface DashboardResponse {
  success: true;
  data: {
    user: UserDashboardMetrics;
    learning: LearningDashboardMetrics;
    revenue?: RevenueMetrics;
    period: {
      start: Date;
      end: Date;
      comparison: {
        start: Date;
        end: Date;
      };
    };
  };
}
```

---

# 6. Analytics Pipeline

# 6.1 Event Processing Worker

```typescript
// analytics/event-processor.worker.ts
@Processor('analytics-events')
export class AnalyticsEventProcessor {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async processEvents(job: Job<AnalyticsEvent[]>) {
    const events = job.data;

    // Group events by user for batch processing
    const userEvents = groupBy(events, 'userId');

    for (const [userId, userEventList] of Object.entries(userEvents)) {
      await this.processUserEvents(userId, userEventList);
    }
  }

  private async processUserEvents(userId: string, events: AnalyticsEvent[]) {
    const date = getDateFromTimestamp(events[0].timestamp);

    // Upsert daily stats
    await this.updateDailyStats(userId, date, events);

    // Update learning metrics
    await this.updateLearningMetrics(userId, events);

    // Emit derived events
    await this.emitDerivedEvents(events);
  }
}
```

---

# 6.2 Daily Aggregation Job

```typescript
// jobs/aggregate-daily-metrics.ts
@Injectable()
export class AggregateDailyMetricsJob {
  @Cron('0 1 * * *') // Run at 1 AM
  async aggregateYesterday() {
    const yesterday = subDays(startOfDay(new Date()), 1);

    // Aggregate DAU
    await this.aggregateDAU(yesterday);

    // Aggregate user metrics
    await this.aggregateUserMetrics(yesterday);

    // Update cohorts
    await this.updateCohorts(yesterday);

    // Calculate retention
    await this.calculateRetention(yesterday);
  }
}
```

---

# 7. User Analytics

# 7.1 User Profile Analytics

```typescript
interface UserAnalytics {
  userId: string;

  // Activity
  totalStudyMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;

  // Learning
  totalWordsLearned: number;
  totalFlashcardsReviewed: number;
  totalQuizzesCompleted: number;
  averageAccuracy: number;

  // Engagement
  daysActive: number;
  lastActiveDate: Date;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
}
```

---

# 7.2 Learning Insights

```typescript
interface LearningInsights {
  // Strengths
  strongTopics: {
    topicId: string;
    topicName: string;
    accuracy: number;
  }[];

  // Weaknesses
  weakTopics: {
    topicId: string;
    topicName: string;
    accuracy: number;
    recommendation: string;
  }[];

  // Patterns
  bestStudyTime: string;
  optimalSessionLength: number;
  recommendedDailyGoal: number;

  // Predictions
  predictedLevel: number;
  estimatedProficiency: string;
}
```

---

# 8. Real-time Analytics

# 8.1 Real-time Dashboard

```typescript
// Real-time metrics via WebSocket
interface RealTimeMetrics {
  currentActiveUsers: number;
  flashcardReviewsLastHour: number;
  quizzesCompletedLastHour: number;
  avgResponseTime: number;
  errorRate: number;
}

// Update every 30 seconds
setInterval(async () => {
  const metrics = await calculateRealTimeMetrics();
  io.emit('analytics:realtime', metrics);
}, 30000);
```

---

# 8.2 Activity Feed

```typescript
// Live activity feed
interface ActivityFeedItem {
  id: string;
  type: 'flashcard' | 'quiz' | 'speaking' | 'achievement';
  userId: string;
  userName: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Subscribe to activity feed
io.on('connection', (socket) => {
  socket.on('subscribe:activity', () => {
    socket.join('activity:feed');
  });
});

// Emit new activities
async function emitActivity(event: AnalyticsEvent) {
  if (event.event.includes('completed') || event.event.includes('unlocked')) {
    io.to('activity:feed').emit('activity:new', {
      id: event.id,
      type: mapEventToActivityType(event.event),
      userId: event.userId,
      action: event.event,
      metadata: event.properties,
      timestamp: event.timestamp,
    });
  }
}
```

---

# 9. Reporting

# 9.1 Scheduled Reports

```typescript
// Daily Report Email
@Cron('0 9 * * *') // 9 AM daily
async sendDailyReport() {
  const users = await prisma.user.findMany({
    where: { notificationPrefs: { dailyReport: true } },
  });

  for (const user of users) {
    const report = await this.generateDailyReport(user.id);
    await this.emailService.send({
      to: user.email,
      template: 'daily-report',
      data: report,
    });
  }
}
```

---

# 9.2 Report Types

```typescript
// Weekly Report
interface WeeklyReport {
  week: DateRange;
  totalStudyTime: number;
  totalCardsReviewed: number;
  totalQuizzes: number;
  accuracyTrend: number[];
  streakDays: number;
  achievementsUnlocked: string[];
  topTopic: string;
  improvementArea: string;
}

// Monthly Report
interface MonthlyReport {
  month: DateRange;
  totalStudyTime: number;
  daysActive: number;
  currentStreak: number;
  levelProgress: number;
  xpEarned: number;
  topicBreakdown: Record<string, number>;
  accuracyByTopic: Record<string, number>;
  comparisonWithLastMonth: {
    studyTimeChange: number;
    accuracyChange: number;
    activityChange: number;
  };
}
```

---

# 10. A/B Testing Integration

# 10.1 Experiment Tracking

```typescript
interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  userId: string;
  assignmentDate: Date;
  conversionEvent?: string;
  convertedAt?: Date;
}

// Track experiment assignments
async function trackExperimentAssignment(experiment: Experiment, variant: Variant, userId: string) {
  await prisma.analyticsEvents.create({
    data: {
      event: 'experiment_assigned',
      userId,
      properties: {
        experiment_id: experiment.id,
        variant_id: variant.id,
      },
    },
  });
}
```

---

# 11. Privacy & Compliance

# 11.1 Data Anonymization

```typescript
// Anonymize data for users who request deletion
async function anonymizeUserData(userId: string) {
  await prisma.analyticsEvents.updateMany({
    where: { userId },
    data: {
      userId: null,
      anonymousId: hashUserId(userId),
      context: {
        // Remove potentially identifying info
        ip: null,
        userAgent: null,
      },
    },
  });
}
```

---

# 11.2 Data Retention

```typescript
// Retention policy
const RETENTION_DAYS = {
  detailed_events: 90,    // 3 months
  aggregated_daily: 365,  // 1 year
  user_reports: 730,      // 2 years
};
```

---

# 12. Implementation Checklist

- [ ] Analytics event schema
- [ ] Event tracking SDK
- [ ] Event collection API
- [ ] Event queue processing
- [ ] Daily stats aggregation
- [ ] User metrics calculation
- [ ] Dashboard API
- [ ] Real-time updates
- [ ] Scheduled reports
- [ ] Data retention policy

---

# 13. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
