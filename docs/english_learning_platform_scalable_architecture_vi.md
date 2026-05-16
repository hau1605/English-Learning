# Thiết kế hệ thống Web học tiếng Anh có khả năng scale

## Mục tiêu hệ thống

Xây dựng nền tảng học tiếng Anh theo hướng production-ready:

- Có thể scale từ vài trăm đến hàng triệu user
- Hỗ trợ mở rộng tính năng dễ dàng
- Dễ maintain
- Tối ưu performance
- Hỗ trợ AI features
- Có khả năng realtime
- Có hệ thống analytics
- Có queue/background jobs
- Có khả năng tách microservice sau này

---

# 1. Tổng quan kiến trúc hệ thống

## Kiến trúc giai đoạn MVP

```txt
                    CDN
                     |
                Next.js App
                     |
                 Nginx
                     |
               NestJS API
                     |
 ------------------------------------------------
| PostgreSQL | Redis | BullMQ | MinIO/S3 Storage |
 ------------------------------------------------
```

## Kiến trúc scale lớn

```txt
                               CDN
                                |
                        Next.js Frontend
                                |
                           Load Balancer
                                |
                           API Gateway
                                |
 --------------------------------------------------------------------------------
| Auth Service | Learning Service | Quiz Service | AI Service | Media Service |
 --------------------------------------------------------------------------------
                                |
                         Message Queue
                                |
                  PostgreSQL + Redis Cluster
                                |
                         Object Storage
```

---

# 2. Tech Stack đề xuất

## Frontend

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Server State | React Query |
| Form | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Realtime | Socket.io Client |

---

## Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | NestJS |
| ORM | Prisma |
| Validation | class-validator |
| Authentication | JWT |
| Queue | BullMQ |
| Realtime | Socket.io |
| Cache | Redis |
| API Docs | Swagger |

---

## Infrastructure

| Thành phần | Công nghệ |
|---|---|
| Database | PostgreSQL |
| Cache | Redis |
| Storage | MinIO / AWS S3 |
| Reverse Proxy | Nginx |
| Container | Docker |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | Winston + Loki |

---

# 3. Domain Driven Design

Hệ thống chia thành các domain chính:

```txt
Auth Domain
User Domain
Learning Domain
Vocabulary Domain
Grammar Domain
Quiz Domain
Progress Domain
Speaking Domain
AI Domain
Notification Domain
Media Domain
Analytics Domain
Admin Domain
```

---

# 4. Thiết kế Database

# 4.1 Nguyên tắc thiết kế

## Dùng UUID

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Lý do:

- Scale tốt
- Không bị enumeration
- Merge data dễ
- Hỗ trợ distributed systems

---

## Có audit fields

```sql
created_at TIMESTAMP
updated_at TIMESTAMP
created_by UUID
updated_by UUID
```

---

## Soft delete

```sql
deleted_at TIMESTAMP NULL
```

---

## Indexing

Ví dụ:

```sql
CREATE INDEX idx_vocab_topic ON vocabularies(topic_id);
CREATE INDEX idx_vocab_word ON vocabularies(word);
```

---

# 5. Thiết kế ERD

# 5.1 User & Auth

```txt
users
- id
- email
- password_hash
- full_name
- avatar_url
- level
- xp
- streak_days
- role_id
- status
- created_at
- updated_at

roles
- id
- name

permissions
- id
- key

role_permissions
- role_id
- permission_id

user_sessions
- id
- user_id
- refresh_token
- expired_at
- ip_address
- device

otp_verifications
- id
- email
- otp_code
- expired_at
```

---

# 5.2 Learning System

```txt
courses
- id
- title
- description
- thumbnail
- level
- status

course_sections
- id
- course_id
- title
- order_index

lessons
- id
- section_id
- title
- type
- order_index
- estimated_time
```

---

# 5.3 Vocabulary

```txt
topics
- id
- name
- slug

vocabularies
- id
- topic_id
- word
- pronunciation
- meaning
- example
- audio_url
- image_url
- difficulty

user_vocabularies
- id
- user_id
- vocabulary_id
- learned
- correct_count
- wrong_count
- next_review_at
- ease_factor
- interval_days
```

---

# 5.4 Grammar

```txt
grammar_categories
- id
- name

grammar_lessons
- id
- category_id
- title
- explanation
- difficulty
```

---

# 5.5 Quiz System

```txt
quizzes
- id
- lesson_id
- title
- duration_seconds
- passing_score

quiz_questions
- id
- quiz_id
- type
- question
- explanation
- order_index

quiz_answers
- id
- question_id
- answer
- is_correct

user_quiz_attempts
- id
- user_id
- quiz_id
- score
- total_correct
- started_at
- submitted_at
```

---

# 5.6 Speaking System

```txt
speaking_exercises
- id
- lesson_id
- text_content
- expected_pronunciation

user_speaking_attempts
- id
- user_id
- speaking_exercise_id
- audio_url
- transcript
- pronunciation_score
- fluency_score
- ai_feedback
```

---

# 5.7 Notification System

```txt
notifications
- id
- type
- title
- content

user_notifications
- id
- user_id
- notification_id
- is_read
```

---

# 5.8 Analytics

```txt
lesson_views
- id
- user_id
- lesson_id
- viewed_at

user_daily_stats
- id
- user_id
- learned_words
- quiz_completed
- study_minutes
- date
```

---

# 6. ERD Relationships

```txt
users 1-N user_sessions
users N-1 roles
roles N-N permissions

courses 1-N course_sections
course_sections 1-N lessons

lessons 1-N quizzes
quizzes 1-N quiz_questions
quiz_questions 1-N quiz_answers

users 1-N user_quiz_attempts

topics 1-N vocabularies
users 1-N user_vocabularies

lessons 1-N speaking_exercises
users 1-N user_speaking_attempts
```

---

# 7. Folder Structure Frontend

```txt
src/
 ├── app/
 │    ├── (auth)/
 │    ├── dashboard/
 │    ├── learning/
 │    ├── vocabulary/
 │    ├── grammar/
 │    ├── quiz/
 │    ├── speaking/
 │    └── admin/
 │
 ├── components/
 │    ├── ui/
 │    ├── common/
 │    ├── layouts/
 │    ├── forms/
 │    └── charts/
 │
 ├── features/
 │    ├── auth/
 │    ├── learning/
 │    ├── quiz/
 │    ├── vocabulary/
 │    └── speaking/
 │
 ├── services/
 ├── hooks/
 ├── stores/
 ├── utils/
 ├── constants/
 ├── types/
 └── lib/
```

---

# 8. Folder Structure Backend

```txt
src/
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── learning/
 │    ├── vocabulary/
 │    ├── grammar/
 │    ├── quiz/
 │    ├── speaking/
 │    ├── ai/
 │    ├── notifications/
 │    ├── analytics/
 │    └── admin/
 │
 ├── common/
 │    ├── decorators/
 │    ├── guards/
 │    ├── filters/
 │    ├── interceptors/
 │    ├── pipes/
 │    ├── constants/
 │    ├── enums/
 │    └── utils/
 │
 ├── prisma/
 ├── configs/
 ├── queues/
 ├── events/
 ├── websocket/
 └── main.ts
```

---

# 9. Kiến trúc Clean Architecture

```txt
modules/
 ├── auth/
 │    ├── application/
 │    ├── domain/
 │    ├── infrastructure/
 │    ├── presentation/
 │    └── auth.module.ts
```

## application

Chứa:

- use cases
- business logic
- services

## domain

Chứa:

- entities
- interfaces
- domain rules

## infrastructure

Chứa:

- prisma repository
- redis
- queue
- external APIs

## presentation

Chứa:

- controllers
- DTOs
- validators

---

# 10. Authentication Flow

## Login Flow

```txt
User Login
   |
Validate Credentials
   |
Generate Access Token
Generate Refresh Token
   |
Save Session Redis/DB
   |
Return Tokens
```

---

# 11. Authorization

## RBAC

```txt
ADMIN
TEACHER
STUDENT
```

## Permission Example

```txt
course.create
course.update
course.delete
quiz.submit
```

---

# 12. Redis Strategy

## Cache

### Cached Data

- lesson detail
- vocabulary list
- leaderboard
- grammar content

---

## Session Store

```txt
session:user_id
```

---

## Rate Limiting

```txt
login:user_ip
```

---

## Queue System

```txt
email_queue
ai_queue
notification_queue
audio_queue
```

---

# 13. Queue Architecture

## BullMQ

### Email Queue

```txt
Register
   |
Add send email job
   |
Worker process email
```

---

### AI Queue

```txt
User upload speaking
   |
Add AI processing job
   |
Worker call AI service
   |
Save feedback
```

---

# 14. File Storage Architecture

## Không lưu local files

Sai:

```txt
/uploads/audio.mp3
```

Đúng:

```txt
MinIO/S3
```

DB chỉ lưu:

```txt
file_key
file_url
mime_type
size
```

---

# 15. AI Architecture

## AI Features

- AI chatbot
- AI speaking feedback
- AI grammar explanation
- AI quiz generation

---

## AI Flow

```txt
Frontend
   |
Backend
   |
AI Service
   |
OpenAI/Whisper
```

---

# 16. Speaking AI Pipeline

```txt
User Record Audio
   |
Upload Audio
   |
Queue Processing
   |
Speech-to-Text
   |
Pronunciation Analysis
   |
Generate Feedback
   |
Save Result
```

---

# 17. Realtime Architecture

## WebSocket Use Cases

- leaderboard realtime
- online classroom
- realtime notifications
- speaking room

---

# 18. Search Architecture

## Giai đoạn đầu

PostgreSQL Full Text Search

---

## Scale lớn

Elasticsearch

---

# 19. Security Architecture

## Authentication

```txt
Access Token: 15 minutes
Refresh Token: 7 days
```

---

## Security Headers

- Helmet
- CORS
- CSP

---

## Validation

- DTO validation
- sanitize HTML
- escape user input

---

## Rate Limit

Ví dụ:

```txt
100 requests/minute
```

---

# 20. Logging System

## Winston

Log levels:

```txt
error
warn
info
debug
```

---

## Centralized Logging

```txt
NestJS
   |
Loki
   |
Grafana
```

---

# 21. Monitoring System

## Metrics

- CPU
- RAM
- request count
- response time
- error rate
- queue size

---

## Monitoring Stack

```txt
Prometheus
Grafana
```

---

# 22. CI/CD Pipeline

## GitHub Actions

```txt
Push Code
   |
Run Tests
   |
Build Docker
   |
Deploy Server
```

---

# 23. Docker Architecture

## docker-compose.yml

```txt
frontend
backend
postgres
redis
minio
nginx
```

---

# 24. Scaling Strategy

# Phase 1

## 1k - 10k users

- Modular Monolith
- PostgreSQL
- Redis
- BullMQ

---

# Phase 2

## 100k users

- Multiple backend instances
- Redis cluster
- CDN
- Queue workers

---

# Phase 3

## 1M users

Tách services:

- AI service
- media service
- analytics service
- notification service

---

# 25. Database Optimization

## Indexing

```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_quiz_lesson ON quizzes(lesson_id);
```

---

## Pagination

Không dùng:

```sql
LIMIT 100000, 20
```

Dùng:

```sql
Cursor Pagination
```

---

# 26. API Design

## REST API

```txt
/api/v1/auth
/api/v1/users
/api/v1/courses
/api/v1/quizzes
```

---

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

# 27. Feature Roadmap

# MVP

- Auth
- Vocabulary
- Quiz
- Progress

---

# Phase 2

- Speaking
- AI
- Notifications
- Leaderboard

---

# Phase 3

- Adaptive learning
- Recommendation system
- Live classroom
- Gamification

---

# 28. Các feature đáng giá cho CV

## High-value Features

- Spaced repetition
- AI speaking feedback
- Adaptive learning
- Gamification
- Daily challenge
- Leaderboard
- Streak system
- AI generated quizzes

---

# 29. Sai lầm phổ biến

## Over-engineering

Không dùng microservice quá sớm.

---

## Không dùng queue

AI/email/audio chạy sync.

---

## Không cache

DB quá tải.

---

## Thiết kế DB sai

- thiếu index
- nhét JSON quá nhiều
- query N+1

---

# 30. Kiến trúc đề xuất cuối cùng

## Frontend

```txt
Next.js
Tailwind
React Query
Zustand
```

---

## Backend

```txt
NestJS
Prisma
BullMQ
Socket.io
```

---

## Infrastructure

```txt
PostgreSQL
Redis
MinIO
Docker
Nginx
```

---

## Deployment

```txt
Frontend: Vercel
Backend: VPS/Docker
Database: PostgreSQL
Storage: S3/MinIO
```

---

# 31. Kết luận

Kiến trúc tối ưu nhất cho project này:

```txt
Next.js
NestJS Modular Monolith
PostgreSQL
Redis
BullMQ
MinIO
Docker
```

Đây là kiến trúc:

- đủ mạnh cho production
- đủ dễ maintain
- dễ scale
- phù hợp portfolio
- phù hợp startup thật
- chưa bị over-engineering

