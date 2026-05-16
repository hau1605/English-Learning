# Cursor Rules, Engineering Standards & Architecture Guidelines

# Mục tiêu

Tài liệu này dùng làm:

- global engineering rules
- coding standards
- architecture standards
- project structure guidelines
- Cursor AI instructions
- development conventions
- production best practices

Mục tiêu:

- code consistency
- scalable architecture
- tránh technical debt
- maintainable codebase
- clean project structure
- production-ready development

Tài liệu này áp dụng cho:

- frontend
- backend
- database
- infrastructure
- AI integration
- realtime systems

---

# 1. Global Development Principles

# 1.1 Không over-engineering

Ưu tiên:

```txt
simple
maintainable
scalable
```

Không build:

- microservices quá sớm
- distributed systems quá sớm
- abstractions không cần thiết

---

# 1.2 Architecture First

Trước khi code:

- xác định domain
- xác định boundaries
- xác định data flow
- xác định ownership

---

# 1.3 Feature-based Development

Không organize theo:

```txt
controllers/
services/
models/
```

quá lớn.

Ưu tiên:

```txt
features/
modules/
```

---

# 1.4 Scalability Principles

Code phải:

- stateless
- cacheable
- async-friendly
- horizontally scalable

---

# 1.5 Clean Code

Code phải:

- readable
- predictable
- testable
- modular
- typed

---

# 2. Core Architecture Rules

# 2.1 Architecture Style

Dùng:

```txt
Modular Monolith
```

KHÔNG dùng microservices ở phase đầu.

---

# 2.2 Backend Architecture

Stack:

```txt
NestJS
Prisma
PostgreSQL
Redis
BullMQ
```

---

# 2.3 Frontend Architecture

Stack:

```txt
Next.js
TypeScript
Tailwind CSS
React Query
Zustand
```

---

# 2.4 API-first Architecture

Frontend/mobile dùng chung API.

Backend KHÔNG phụ thuộc frontend.

---

# 2.5 Event-driven Mindset

Các action quan trọng phải emit event.

Ví dụ:

```txt
FlashcardReviewedEvent
QuizCompletedEvent
LessonCompletedEvent
```

---

# 3. Backend Rules

# 3.1 Backend Folder Structure

```txt
src/
 ├── modules/
 ├── common/
 ├── configs/
 ├── prisma/
 ├── queues/
 ├── websocket/
 ├── events/
 ├── jobs/
 └── main.ts
```

---

# 3.2 Module Structure

Mỗi module:

```txt
module/
 ├── controllers/
 ├── services/
 ├── repositories/
 ├── dto/
 ├── entities/
 ├── interfaces/
 ├── events/
 ├── listeners/
 ├── jobs/
 └── module.ts
```

---

# 3.3 Service Rules

Service:

- chứa business logic
- không query raw SQL trực tiếp
- không xử lý HTTP response
- không xử lý UI logic

---

# 3.4 Controller Rules

Controller:

- chỉ xử lý request/response
- validate input
- gọi service
- không chứa business logic

---

# 3.5 Repository Rules

Repository:

- query database
- encapsulate DB logic
- reusable queries

---

# 3.6 DTO Rules

Mọi input phải dùng DTO.

Ví dụ:

```ts
export class CreateLessonDto {
  @IsString()
  title: string;
}
```

---

# 3.7 Validation Rules

Bắt buộc:

```txt
class-validator
ValidationPipe
```

Không trust frontend.

---

# 3.8 Response Standard

## Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 3.9 API Rules

- RESTful naming
- plural resources
- versioned APIs

Ví dụ:

```txt
/api/v1/flashcards
```

---

# 3.10 Database Rules

## Không dùng auto increment

Dùng:

```txt
UUID
```

---

# Naming Convention

## Tables

```txt
snake_case
plural
```

Ví dụ:

```txt
user_flashcard_reviews
```

---

## Columns

```txt
snake_case
```

---

# Required Columns

Mọi table nên có:

```txt
id
created_at
updated_at
```

---

# Soft Delete

Nếu cần:

```txt
deleted_at
```

---

# Index Rules

Index:

- foreign keys
- frequently queried columns
- sorting columns
- filtering columns

---

# Không query N+1

Sai:

```txt
loop queries
```

Ưu tiên:

```txt
joins
includes
batch loading
```

---

# 3.11 Redis Rules

Redis dùng cho:

- cache
- sessions
- rate limit
- queues
- realtime state

Không lưu business data.

---

# Cache Key Convention

```txt
module:resource:id
```

Ví dụ:

```txt
flashcards:due:user_id
```

---

# 3.12 Queue Rules

Queue cho:

- email
- notifications
- AI processing
- analytics
- background jobs

Không xử lý sync.

---

# Queue Naming

```txt
email_queue
analytics_queue
speaking_queue
```

---

# Retry Policy

```txt
retry: 3
backoff: exponential
```

---

# 3.13 Event Rules

Naming:

```txt
resource.action
```

Ví dụ:

```txt
flashcard.reviewed
quiz.completed
```

---

# Event Payload

```ts
{
  userId,
  targetId,
  metadata,
  createdAt,
}
```

---

# 3.14 Permission Rules

Dùng dynamic RBAC.

Không hardcode:

```ts
if (user.role === 'admin')
```

---

# Permission Naming

```txt
resource.action
```

Ví dụ:

```txt
lesson.create
lesson.publish
```

---

# 3.15 Logging Rules

Log:

- requests
- errors
- queue failures
- websocket errors
- auth failures

---

# Không log

- passwords
- tokens
- sensitive data

---

# 3.16 Security Rules

Bắt buộc:

- JWT auth
- rate limit
- validation
- CORS
- helmet
- password hashing

---

# Không trust frontend permissions

Backend phải validate.

---

# 3.17 File Upload Rules

Không lưu local uploads.

Dùng:

```txt
MinIO/S3
```

---

# Upload Pipeline

```txt
validate
compress
store
queue processing
```

---

# 3.18 Testing Rules

Bắt buộc test:

- business logic
- permissions
- auth
- critical flows

---

# Testing Pyramid

| Type | Scope |
|---|---|
| Unit | services |
| Integration | modules |
| E2E | user flows |

---

# 4. Frontend Rules

# 4.1 Frontend Folder Structure

```txt
src/
 ├── app/
 ├── components/
 ├── features/
 ├── hooks/
 ├── services/
 ├── stores/
 ├── lib/
 ├── utils/
 └── types/
```

---

# 4.2 Component Rules

Component:

- nhỏ
- reusable
- focused
- typed

---

# Không viết component quá lớn

Nếu:

```txt
> 300 lines
```

→ cần refactor.

---

# 4.3 Business Logic Rules

Không nhét business logic vào component.

Tách:

- hooks
- services
- stores

---

# 4.4 State Management Rules

## React Query

Dùng cho:

```txt
server state
```

---

## Zustand

Dùng cho:

```txt
client state
```

---

# Không duplicate state

---

# 4.5 API Rules

Không call fetch trực tiếp trong component.

Dùng:

```txt
services/
api layer
```

---

# 4.6 Form Rules

Bắt buộc:

```txt
React Hook Form
Zod
```

---

# 4.7 UI Rules

UI phải:

- responsive
- accessible
- keyboard-friendly
- loading-friendly

---

# Bắt buộc có

- loading states
- empty states
- error states
- skeleton loading

---

# 4.8 Styling Rules

Dùng:

```txt
Tailwind CSS
```

---

# Không inline styles

Sai:

```tsx
style={{}}
```

---

# Class Organization

Ưu tiên:

```txt
layout
spacing
typography
colors
states
```

---

# 4.9 Animation Rules

Dùng:

```txt
Framer Motion
```

Không animate quá nhiều.

---

# 4.10 SEO Rules

SEO pages:

- homepage
- lessons
- grammar
- blogs

---

# Metadata

Dùng:

```txt
generateMetadata()
```

---

# 4.11 Accessibility Rules

Bắt buộc:

- aria labels
- keyboard navigation
- focus states
- semantic HTML

---

# 4.12 Performance Rules

Bắt buộc:

- lazy loading
- memoization
- optimized images
- virtualization cho lists lớn

---

# 5. AI Integration Rules

# Không gọi AI trực tiếp từ frontend

Frontend -> Backend -> AI Provider

---

# AI Requests phải qua queue

Không xử lý sync.

---

# AI Cost Optimization

Bắt buộc:

- caching
- rate limiting
- retries
- timeout handling

---

# 6. Realtime Rules

# WebSocket Use Cases

- notifications
- leaderboard
- classrooms
- live speaking

---

# Socket Events Naming

```txt
resource.action
```

Ví dụ:

```txt
leaderboard.updated
notification.created
```

---

# 7. Git Rules

# Branch Naming

```txt
feature/flashcard-review
bugfix/auth-refresh
refactor/permission-system
```

---

# Commit Convention

```txt
feat:
fix:
refactor:
chore:
```

---

# Example

```txt
feat: implement flashcard review session
```

---

# 8. Environment Rules

Không hardcode secrets.

Dùng:

```txt
.env
```

---

# Environment Naming

```txt
DATABASE_URL
REDIS_URL
JWT_SECRET
```

---

# 9. Infrastructure Rules

# Docker-first

Mọi service phải chạy được bằng Docker.

---

# Services

```txt
frontend
backend
postgres
redis
worker
nginx
```

---

# Không deploy manual

Ưu tiên:

```txt
CI/CD
```

---

# 10. Monitoring Rules

Track:

- response time
- memory usage
- queue failures
- websocket disconnects
- DB slow queries

---

# Logging Stack

```txt
Winston
Grafana
Prometheus
```

---

# 11. Scalability Rules

Code phải:

- stateless
- horizontally scalable
- cache-friendly
- async-friendly

---

# Không giữ state trong memory

Sai:

```txt
in-memory sessions
```

---

# 12. Cursor AI Rules

# Cursor phải:

- follow existing architecture
- follow naming conventions
- generate typed code
- avoid duplicate logic
- avoid massive files
- avoid business logic in controllers/components

---

# Cursor không được:

- hardcode permissions
- create untyped code
- bypass validation
- write raw SQL nếu không cần
- create circular dependencies
- generate monolithic services

---

# Cursor khi tạo module mới phải:

- create module structure đầy đủ
- create DTOs
- create validations
- create types/interfaces
- create tests nếu cần
- follow folder conventions

---

# 13. Naming Conventions

# Backend

## Files

```txt
kebab-case
```

---

# Classes

```txt
PascalCase
```

---

# Variables

```txt
camelCase
```

---

# Constants

```txt
UPPER_CASE
```

---

# 14. Anti-patterns

# Không làm

## Massive services

```txt
1000+ lines
```

---

## Massive components

```txt
single gigantic component
```

---

## Circular dependencies

---

## Business logic trong controller

---

## Query DB trong loops

---

## Hardcoded permissions

---

## Direct AI calls từ frontend

---

## Sync heavy processing

---

## Trust frontend validation

---

# 15. Recommended Development Order

# Phase 1

- auth
- users
- permissions
- infrastructure

---

# Phase 2

- vocabulary
- flashcards
- quizzes
- progress tracking

---

# Phase 3

- analytics
- notifications
- realtime
- queues

---

# Phase 4

- AI
- speaking
- recommendations

---

# 16. Final Principles

# Ưu tiên

```txt
maintainability > cleverness
```

---

# Ưu tiên

```txt
consistency > perfection
```

---

# Ưu tiên

```txt
simple scalable architecture
```

thay vì:

```txt
complex distributed systems
```

---

# Kết luận

Tài liệu này là global engineering guideline cho toàn bộ project.

Mọi code được generate bởi Cursor hoặc developer phải:

- follow architecture
- follow conventions
- follow scalable patterns
- avoid technical debt
- maintain production standards

