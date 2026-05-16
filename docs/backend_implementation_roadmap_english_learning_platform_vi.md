# Backend Implementation Roadmap - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết roadmap triển khai backend cho hệ thống học tiếng Anh production-ready theo hướng scalable architecture.

Mục tiêu:

- Backend clean architecture
- Scale tốt
- Dễ maintain
- Hỗ trợ AI
- Hỗ trợ flashcard system
- Hỗ trợ realtime
- Hỗ trợ analytics
- Production-ready

---

# 1. Tech Stack Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | BullMQ |
| Authentication | JWT |
| Validation | class-validator |
| Documentation | Swagger |
| Realtime | Socket.io |
| Storage | MinIO/S3 |
| Logging | Winston |
| Deployment | Docker |

---

# 2. Kiến trúc Backend

## Modular Monolith

Giai đoạn đầu KHÔNG dùng microservice.

Kiến trúc:

```txt
Frontend
   |
NestJS API
   |
------------------------------------------------
| Auth | Learning | Quiz | Flashcard | AI |
------------------------------------------------
   |
PostgreSQL + Redis + BullMQ
```

Lý do:

- Dễ phát triển
- Dễ debug
- Dễ deploy
- Dễ maintain
- Vẫn scale tốt tới hàng trăm nghìn users

---

# 3. Cấu trúc thư mục Backend

```txt
src/
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── courses/
 │    ├── lessons/
 │    ├── vocabulary/
 │    ├── flashcards/
 │    ├── quizzes/
 │    ├── grammar/
 │    ├── speaking/
 │    ├── ai/
 │    ├── notifications/
 │    ├── analytics/
 │    └── admin/
 │
 ├── common/
 │    ├── constants/
 │    ├── decorators/
 │    ├── dto/
 │    ├── enums/
 │    ├── exceptions/
 │    ├── filters/
 │    ├── guards/
 │    ├── interceptors/
 │    ├── middleware/
 │    ├── pipes/
 │    ├── services/
 │    └── utils/
 │
 ├── configs/
 ├── prisma/
 ├── queues/
 ├── websocket/
 ├── events/
 ├── jobs/
 ├── scripts/
 └── main.ts
```

---

# 4. Kiến trúc Module

Ví dụ module:

```txt
modules/
 ├── flashcards/
 │    ├── controllers/
 │    ├── services/
 │    ├── repositories/
 │    ├── dto/
 │    ├── entities/
 │    ├── interfaces/
 │    ├── jobs/
 │    ├── events/
 │    ├── listeners/
 │    ├── flashcards.module.ts
```

---

# 5. Prisma Setup

# Cài đặt

```bash
npm install prisma @prisma/client
```

---

# Init

```bash
npx prisma init
```

---

# Folder

```txt
prisma/
 ├── schema.prisma
 ├── migrations/
 └── seed.ts
```

---

# 6. Database Design

# users

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  fullName      String
  avatarUrl     String?
  xp            Int      @default(0)
  streakDays    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

# topics

```prisma
model Topic {
  id            String       @id @default(uuid())
  name          String
  slug          String       @unique
  vocabularies  Vocabulary[]
}
```

---

# vocabularies

```prisma
model Vocabulary {
  id              String   @id @default(uuid())
  topicId         String
  word            String
  pronunciation   String?
  meaning         String
  example         String?
  imageUrl        String?
  audioUrl        String?
  difficulty      Int      @default(1)
  createdAt       DateTime @default(now())

  topic           Topic @relation(fields: [topicId], references: [id])
}
```

---

# flashcards

```prisma
model Flashcard {
  id            String   @id @default(uuid())
  vocabularyId  String
  frontContent  String
  backContent   String
  audioUrl      String?
  imageUrl      String?
  createdAt     DateTime @default(now())
}
```

---

# user flashcard review

```prisma
model UserFlashcardReview {
  id                String   @id @default(uuid())
  userId            String
  flashcardId       String
  repetitionCount   Int      @default(0)
  easeFactor        Float    @default(2.5)
  intervalDays      Int      @default(1)
  nextReviewAt      DateTime
  lastReviewedAt    DateTime?
  correctStreak     Int      @default(0)
  wrongCount        Int      @default(0)

  @@index([userId, nextReviewAt])
}
```

---

# 7. Authentication System

# JWT Strategy

## Access Token

```txt
15 minutes
```

## Refresh Token

```txt
7 days
```

---

# Auth Flow

```txt
Login
  |
Validate User
  |
Generate Tokens
  |
Save Session Redis
  |
Return Tokens
```

---

# Auth APIs

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
```

---

# 8. Flashcard System

# Core Logic

```txt
Get due flashcards
      |
Start review session
      |
Evaluate answer
      |
Update spaced repetition
      |
Save analytics
```

---

# Review Algorithm

## Again

```txt
Reset interval
```

## Hard

```txt
Small interval increase
```

## Good

```txt
Normal increase
```

## Easy

```txt
Large increase
```

---

# API

```txt
GET /flashcards/due
POST /flashcards/review
GET /flashcards/stats
POST /flashcards/generate-ai
```

---

# 9. Quiz System

# Tables

```txt
quizzes
quiz_questions
quiz_answers
user_quiz_attempts
```

---

# APIs

```txt
GET /quizzes
GET /quizzes/:id
POST /quizzes/:id/submit
GET /quizzes/history
```

---

# 10. Queue Architecture

# BullMQ

## Installation

```bash
npm install bullmq ioredis
```

---

# Queues

```txt
email_queue
notification_queue
ai_queue
speaking_queue
analytics_queue
```

---

# AI Queue Flow

```txt
User Upload Audio
      |
Add Queue Job
      |
Worker Process
      |
Call OpenAI
      |
Save Result
```

---

# 11. Redis Strategy

# Cache Keys

```txt
user:profile:user_id
flashcards:due:user_id
leaderboard:global
quiz:detail:quiz_id
```

---

# Cache TTL

| Data | TTL |
|---|---|
| User profile | 10m |
| Leaderboard | 5m |
| Flashcards | 1m |
| Grammar lesson | 1h |

---

# 12. File Upload System

# Không lưu local storage

Sai:

```txt
/uploads/file.mp3
```

Đúng:

```txt
MinIO/S3
```

---

# File Metadata Table

```prisma
model MediaFile {
  id          String   @id @default(uuid())
  fileKey     String
  fileUrl     String
  mimeType    String
  size        Int
  createdAt   DateTime @default(now())
}
```

---

# 13. AI Integration

# AI Features

- Speaking feedback
- AI generated flashcards
- Grammar explanation
- Quiz generation

---

# AI Architecture

```txt
Frontend
   |
Backend
   |
AI Service
   |
OpenAI
```

---

# Speaking Flow

```txt
Upload Audio
   |
Queue Processing
   |
Speech-to-text
   |
Pronunciation Analysis
   |
Save Feedback
```

---

# 14. WebSocket Architecture

# Use Cases

- realtime leaderboard
- notifications
- classroom
- live speaking room

---

# Gateway Structure

```txt
websocket/
 ├── gateways/
 ├── handlers/
 └── events/
```

---

# 15. Validation Strategy

# DTO Validation

```ts
export class LoginDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
```

---

# Global Validation Pipe

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

# 16. Security Architecture

# Security Packages

```bash
npm install helmet
npm install express-rate-limit
npm install bcrypt
```

---

# Security Checklist

- JWT authentication
- password hashing
- rate limit
- XSS protection
- SQL injection prevention
- validation
- CORS
- helmet

---

# 17. Logging System

# Winston

## Log levels

```txt
error
warn
info
debug
```

---

# Request Logging

```txt
method
path
status
response_time
ip
user_agent
```

---

# 18. Error Handling

# Global Exception Filter

```txt
HttpException
PrismaException
ValidationException
UnauthorizedException
```

---

# Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 19. Testing Strategy

# Unit Test

```txt
services
helpers
utils
```

---

# E2E Test

```txt
auth flow
quiz flow
flashcard flow
```

---

# Tools

```bash
Jest
Supertest
```

---

# 20. Docker Setup

# docker-compose

```txt
backend
postgres
redis
minio
nginx
```

---

# Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/main"]
```

---

# 21. Environment Variables

```env
PORT=3000
DATABASE_URL=
REDIS_HOST=
REDIS_PORT=
JWT_SECRET=
JWT_REFRESH_SECRET=
OPENAI_API_KEY=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

---

# 22. Monitoring

# Metrics

- response time
- memory usage
- queue size
- failed jobs
- active users

---

# Monitoring Stack

```txt
Prometheus
Grafana
```

---

# 23. Deployment Strategy

# VPS Deployment

```txt
Nginx
   |
Docker Containers
   |
NestJS API
```

---

# Production Services

```txt
backend
postgres
redis
minio
nginx
queue workers
```

---

# 24. CI/CD Pipeline

# GitHub Actions Flow

```txt
Push Code
   |
Install Dependencies
   |
Run Tests
   |
Build Docker Image
   |
Deploy VPS
```

---

# 25. Performance Optimization

# Database

- indexes
- cursor pagination
- avoid N+1
- optimized queries

---

# Redis

- cache hot data
- session store
- rate limit

---

# Queue

- background processing
- retry mechanism
- concurrency control

---

# 26. Roadmap triển khai Backend

# Phase 1

## Core Foundation

- NestJS setup
- Prisma setup
- PostgreSQL
- Auth system
- User module
- Swagger
- Validation
- Logging

---

# Phase 2

## Learning System

- Topic module
- Vocabulary module
- Flashcard module
- Quiz module
- Progress tracking

---

# Phase 3

## Infrastructure

- Redis
- BullMQ
- MinIO
- Docker
- CI/CD

---

# Phase 4

## AI Features

- OpenAI integration
- Speaking AI
- AI flashcards
- AI quiz generation

---

# Phase 5

## Scale Features

- WebSocket
- Analytics
- Leaderboard
- Recommendation system
- Adaptive learning

---

# 27. Ưu tiên triển khai

# Làm trước

- Auth
- Vocabulary
- Flashcard
- Quiz
- Progress

---

# Làm sau

- AI
- Speaking
- Recommendation
- Adaptive learning

---

# 28. Kết luận

Backend architecture phù hợp nhất:

```txt
NestJS
Prisma
PostgreSQL
Redis
BullMQ
MinIO
Docker
```

Kiến trúc này:

- production-ready
- scale tốt
- dễ maintain
- phù hợp portfolio
- phù hợp startup thật
- dễ mở rộng AI
- phù hợp flashcard system

