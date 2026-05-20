# Crawler Service Integration Guide

This document describes how to integrate the Crawler Service with the English Learning Platform backend.

## Prerequisites

1. **Start Crawler Service:**
```bash
cd crawler-service
docker-compose up -d
```

2. **Configure Backend:**
Add to `backend/.env`:
```env
CRAWLER_API_URL=http://localhost:8000
```

## API Integration

### 1. Trigger Vocabulary Crawl

```typescript
// Call from admin panel
const response = await fetch('/api/crawler/trigger/vocabulary', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    words: ['hello', 'world', 'computer'],
    source: 'free_dictionary',
    pushToBackend: true
  })
});

const { jobId } = await response.json();
console.log('Crawl job queued:', jobId);
```

### 2. Import Vocabulary (Direct Push)

```typescript
const response = await fetch('/api/crawler/vocabulary', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        definitions: [{ meaning: 'A greeting', example: 'Hello!' }],
        difficulty: 1,
        cefrLevel: 'A1'
      }
    ]
  })
});
```

### 3. Monitor Job Status

```typescript
const response = await fetch(`/api/crawler/jobs/${jobId}`);
const job = await response.json();
console.log('Job status:', job.status);
```

## Permissions

The following permissions are required:

| Permission | Description | Default Role |
|------------|-------------|--------------|
| `crawler:read` | View crawl logs and stats | Admin |
| `crawler:create` | Import vocabulary/grammar | Admin |
| `crawler:trigger` | Trigger new crawl jobs | Admin |

## Database Tables

### crawl_sources

Stores information about crawl sources.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR | Source name |
| url | VARCHAR | Base URL |
| sourceType | ENUM | api, web, file |
| contentType | ENUM | vocabulary, grammar, quiz |
| rateLimit | FLOAT | Requests per second |
| isActive | BOOLEAN | Active status |
| lastCrawled | TIMESTAMP | Last crawl time |

### crawl_logs

Stores crawl job history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| sourceId | INTEGER | FK to crawl_sources |
| jobId | VARCHAR | BullMQ job ID |
| status | ENUM | pending, in_progress, completed, failed |
| itemsCrawled | INTEGER | Total items |
| itemsAdded | INTEGER | New items |
| itemsUpdated | INTEGER | Updated items |
| startedAt | TIMESTAMP | Job start time |
| completedAt | TIMESTAMP | Job end time |

## Admin Dashboard

Add these endpoints to your admin panel:

### Crawl Stats Widget
```
GET /api/crawler/stats
```

### Recent Logs
```
GET /api/crawler/logs?limit=10
```

### Available Sources
```
GET /api/crawler/sources
```
