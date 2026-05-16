# Monitoring & Logging - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết hệ thống monitoring và logging cho production, bao gồm metrics, alerting, và observability.

---

# 1. Monitoring Overview

# 1.1 Why Monitoring?

Benefits:

- **Proactive**: Detect issues before users report them
- **Visibility**: Know system health at any time
- **Debugging**: Quick root cause analysis
- **Performance**: Track and optimize
- **Business**: Understand usage patterns
- **SLA**: Meet service level agreements

---

# 1.2 The Three Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│                      Observability                                │
├───────────────────┬─────────────────────┬──────────────────────┤
│     Metrics       │       Logs          │      Traces          │
│   (Quantitative)  │   (Qualitative)     │   (Connections)      │
├───────────────────┼─────────────────────┼──────────────────────┤
│ Prometheus        │ ELK Stack           │ Jaeger               │
│ Grafana           │ Loki                │ OpenTelemetry        │
│ Datadog           │ CloudWatch          │ Zipkin               │
└───────────────────┴─────────────────────┴──────────────────────┘
```

---

# 2. Logging Strategy

# 2.1 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Errors requiring attention | Database connection failed |
| `warn` | Potential issues | Deprecated API used |
| `info` | Important events | User logged in, Quiz completed |
| `debug` | Development details | Request payload, Response time |
| `trace` | Very detailed | Loop iterations, Function entry |

---

# 2.2 Log Format

```typescript
// Structured JSON logging
interface LogEntry {
  timestamp: string;          // ISO 8601
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  message: string;           // Human-readable message
  service: string;           // Service name
  version: string;           // Deployment version
  environment: string;       // development | staging | production
  requestId?: string;       // Correlation ID
  userId?: string;           // User ID if authenticated
  traceId?: string;          // Distributed trace ID
  spanId?: string;           // Trace span ID
  duration?: number;         // Request duration in ms
  metadata: Record<string, any>; // Additional context
}
```

---

# 2.3 Example Log Entries

```json
// Error log
{
  "timestamp": "2024-01-01T10:30:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "service": "api",
  "version": "1.2.0",
  "environment": "production",
  "requestId": "req_abc123",
  "userId": "usr_123",
  "duration": 5000,
  "metadata": {
    "error": "Connection timeout",
    "query": "SELECT * FROM users WHERE id = $1",
    "stack": "Error: Connection timeout\n    at Pool.query..."
  }
}

// Info log
{
  "timestamp": "2024-01-01T10:30:00.000Z",
  "level": "info",
  "message": "User completed quiz",
  "service": "api",
  "version": "1.2.0",
  "environment": "production",
  "requestId": "req_abc123",
  "userId": "usr_123",
  "metadata": {
    "quizId": "quiz_456",
    "score": 85,
    "timeSpent": 1200
  }
}
```

---

# 2.4 Winston Logger Implementation

```typescript
// lib/logger.ts
import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'english-learning-platform',
    version: process.env.APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${level}: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transport - errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport - combined
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Helper to add context
export function createLogger(context: Record<string, any>) {
  return {
    error: (message: string, meta?: any) => logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { ...context, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { ...context, ...meta }),
  };
}
```

---

# 3. Request Logging

# 3.1 HTTP Request Logger

```typescript
// middleware/request-logger.ts
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || generateRequestId();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Store in async context
  asyncLocalStorage.getStore()?.set('requestId', requestId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
```

---

# 3.2 Database Query Logger

```typescript
// prisma-query-logger.ts
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  const result = await next(params);
  const duration = Date.now() - startTime;

  // Log slow queries (> 100ms)
  if (duration > 100) {
    logger.warn('Slow database query', {
      model: params.model,
      action: params.action,
      duration,
      args: params.args,
    });
  }

  return result;
});
```

---

# 3.3 Queue Job Logger

```typescript
// queue-logger.ts
@Injectable()
export class QueueLogger {
  logJobStart(job: Job) {
    logger.info('Queue job started', {
      jobId: job.id,
      jobName: job.name,
      attempts: job.attemptsMade,
    });
  }

  logJobComplete(job: Job, result: any) {
    logger.info('Queue job completed', {
      jobId: job.id,
      jobName: job.name,
      duration: job.processedOn - job.timestamp,
    });
  }

  logJobFailed(job: Job, error: Error) {
    logger.error('Queue job failed', {
      jobId: job.id,
      jobName: job.name,
      attempts: job.attemptsMade,
      error: error.message,
      stack: error.stack,
    });
  }
}
```

---

# 4. Metrics

# 4.1 Application Metrics

# Using Prometheus Client

```typescript
import client, { Counter, Histogram, Gauge } from 'prom-client';

// Counters - cumulative values
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

export const flashcardReviewsTotal = new Counter({
  name: 'flashcard_reviews_total',
  help: 'Total flashcard reviews',
  labelNames: ['result'],
});

export const quizCompletionsTotal = new Counter({
  name: 'quiz_completions_total',
  help: 'Total quiz completions',
  labelNames: ['quiz_id'],
});

// Histograms - distributions
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['model', 'action'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job duration',
  labelNames: ['job_name'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
});

// Gauges - current values
export const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

export const queueSizeGauge = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
});

export const databaseConnectionsGauge = new Gauge({
  name: 'database_connections',
  help: 'Database connection pool',
  labelNames: ['state'],
});
```

---

# 4.2 Custom Metrics

# Business Metrics

```typescript
// Daily active users
export const dailyActiveUsers = new Gauge({
  name: 'daily_active_users',
  help: 'Daily active users count',
});

// Learning metrics
export const dailyFlashcardsReviewed = new Gauge({
  name: 'daily_flashcards_reviewed',
  help: 'Flashcards reviewed today',
});

export const dailyQuizzesCompleted = new Gauge({
  name: 'daily_quizzes_completed',
  help: 'Quizzes completed today',
});

// System health
export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
});

export const errorRate = new Gauge({
  name: 'error_rate_percent',
  help: 'Error rate percentage',
});
```

---

# 5. Health Checks

# 5.1 Health Check Endpoint

```typescript
// GET /health
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    queue: CheckResult;
  };
}

interface CheckResult {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

// Implementation
@Get('health')
async healthCheck(): Promise<HealthCheckResponse> {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkQueue(),
  ]);

  const checkResults = {
    database: checks[0] as PromiseLike<CheckResult>,
    redis: checks[1] as PromiseLike<CheckResult>,
    queue: checks[2] as PromiseLike<CheckResult>,
  };

  const allHealthy = Object.values(checkResults).every(c => c.status === 'up');
  const anyUnhealthy = Object.values(checkResults).some(c => c.status === 'down');

  return {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
    version: process.env.APP_VERSION || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: checkResults,
  };
}

private async checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up', latency: Date.now() - start };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
}
```

---

# 5.2 Readiness vs Liveness

```typescript
// Liveness - Is the app running?
@Get('health/live')
async liveness(): Promise<{ status: string }> {
  return { status: 'ok' };
}

// Readiness - Can the app serve traffic?
@Get('health/ready')
async readiness(): Promise<{ status: string; checks: Record<string, boolean> }> {
  const checks = {
    database: await this.isDatabaseReady(),
    redis: await this.isRedisReady(),
  };

  const ready = Object.values(checks).every(Boolean);

  return {
    status: ready ? 'ready' : 'not_ready',
    checks,
  };
}
```

---

# 6. Alerting

# 6.1 Alert Rules

# Prometheus Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: english-learning-platform
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) /
          rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"

      # High Response Time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      # Database Connection Pool Exhausted
      - alert: DatabasePoolExhausted
        expr: database_connections{state="active"} / database_connections{state="total"} > 0.9
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Active connections are using {{ $value | humanizePercentage }} of pool"

      # Queue Failures
      - alert: QueueFailureRate
        expr: |
          rate(queue_jobs_failed_total[15m]) /
          rate(queue_jobs_completed_total[15m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High queue failure rate"
          description: "Queue failure rate is {{ $value | humanizePercentage }}"

      # Low Cache Hit Rate
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.7
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }}"

      # No Active Users
      - alert: NoActiveUsers
        expr: daily_active_users == 0
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "No active users detected"
          description: "No active users in the last 30 minutes"
```

---

# 6.2 Alert Routing

```typescript
// alert-manager.ts
interface Alert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  service: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

async function sendAlert(alert: Alert) {
  // PagerDuty for critical
  if (alert.severity === 'critical') {
    await pagerduty.notify({
      title: alert.title,
      description: alert.description,
      severity: 'critical',
    });
  }

  // Slack for all
  await slack.notify({
    channel: alert.severity === 'critical' ? '#incidents' : '#alerts',
    title: alert.title,
    description: alert.description,
    metadata: alert.metadata,
  });

  // Email for critical only
  if (alert.severity === 'critical') {
    await email.send({
      to: 'oncall@example.com',
      subject: `[CRITICAL] ${alert.title}`,
      body: alert.description,
    });
  }
}
```

---

# 7. Distributed Tracing

# 7.1 OpenTelemetry Setup

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@opentelemetry/instrumentation-prisma';

const sdk = new NodeSDK({
  serviceName: 'english-learning-platform',
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

sdk.start();
```

---

# 7.2 Manual Tracing

```typescript
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('english-learning-platform');

async function processFlashcardReview(data: FlashcardReviewData) {
  return tracer.startActiveSpan('flashcard-review', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'user.id': data.userId,
      'flashcard.id': data.flashcardId,
      'review.result': data.result,
    },
  }, async (span) => {
    try {
      const result = await doProcessing(data);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

# 8. Dashboard

# 8.1 Grafana Dashboard

```json
{
  "dashboard": {
    "title": "English Learning Platform",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Errors"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_bucket[5m]))",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "daily_active_users",
            "legendFormat": ""
          }
        ]
      },
      {
        "title": "Queue Size",
        "type": "graph",
        "targets": [
          {
            "expr": "queue_size",
            "legendFormat": "{{queue_name}}"
          }
        ]
      }
    ]
  }
}
```

---

# 9. Log Aggregation

# 9.1 ELK Stack Integration

```typescript
// Winston transport for Elasticsearch
import winston from 'winston';
import TransportStream from 'winston-transport';

class ElasticsearchTransport extends TransportStream {
  constructor(opts) {
    super(opts);
    this.client = new Client({ node: opts.node });
  }

  async log(info, callback) {
    setTimeout(() => {
      this.client.index({
        index: `logs-${dayjs().format('YYYY.MM.DD')}`,
        document: info,
      });
      callback();
    }, 0);
  }
}

export const logger = winston.createLogger({
  transports: [
    new ElasticsearchTransport({
      node: process.env.ELASTICSEARCH_URL,
      level: 'info',
    }),
  ],
});
```

---

# 9.2 Log Queries

```typescript
// Example log queries
const queries = {
  // Find all errors for a user
  errorsByUser: {
    index: 'logs-*',
    body: {
      query: {
        bool: {
          must: [
            { term: { level: 'error' } },
            { term: { 'metadata.userId': 'usr_123' } },
          ],
        },
      },
    },
  },

  // Find slow requests
  slowRequests: {
    index: 'logs-*',
    body: {
      query: {
        bool: {
          must: [
            { term: { level: 'info' } },
            { range: { duration: { gt: 5000 } } },
          ],
        },
      },
    },
  },

  // Request timeline
  requestTimeline: {
    index: 'logs-*',
    body: {
      query: {
        term: { requestId: 'req_abc123' },
      },
      sort: [{ timestamp: 'asc' }],
    },
  },
};
```

---

# 10. SLA Monitoring

# 10.1 SLA Definitions

| SLA | Target | Measurement |
|-----|--------|-------------|
| Uptime | 99.9% | Monthly |
| Response Time (p95) | < 2s | Daily |
| Response Time (p99) | < 5s | Daily |
| Error Rate | < 1% | Hourly |
| API Availability | 99.95% | Monthly |

---

# 10.2 SLA Dashboard

```typescript
interface SLAMetrics {
  uptime: {
    value: number;
    target: number;
    period: string;
  };
  responseTime: {
    p95: number;
    p99: number;
    target: number;
  };
  errorRate: {
    value: number;
    target: number;
  };
  availability: {
    value: number;
    target: number;
    incidents: number;
  };
}
```

---

# 11. Incident Response

# 11.1 Incident Lifecycle

```typescript
interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  commander: string;
  timeline: IncidentEvent[];
}

interface IncidentEvent {
  timestamp: Date;
  type: 'created' | 'acknowledged' | 'update' | 'resolved';
  message: string;
  actor: string;
}

// Create incident
async function createIncident(alert: Alert): Promise<Incident> {
  const incident = await db.incident.create({
    data: {
      title: alert.title,
      severity: mapAlertToSeverity(alert),
      status: 'open',
      commander: await getOnCallEngineer(),
    },
  });

  await pagerduty.createIncident(incident);
  await slack.notify({
    channel: '#incidents',
    message: `New incident: ${incident.title}`,
  });

  return incident;
}
```

---

# 12. Checklist

# Logging

- [x] Structured logging format
- [x] Request logging middleware
- [x] Database query logging
- [x] Queue job logging
- [ ] Error tracking integration (Sentry)

# Metrics

- [x] Prometheus metrics
- [x] HTTP request metrics
- [x] Database metrics
- [x] Queue metrics
- [x] Business metrics

# Tracing

- [x] OpenTelemetry setup
- [x] HTTP instrumentation
- [x] Database instrumentation
- [ ] Custom spans for business logic

# Alerting

- [x] Alert rules
- [x] Alert routing
- [ ] Runbook integration
- [ ] On-call scheduling

# Dashboard

- [ ] Grafana dashboards
- [ ] SLA monitoring
- [ ] Business metrics dashboard

---

# 13. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
