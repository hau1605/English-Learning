# English Learning Platform

A production-ready English learning platform with flashcards, quizzes, vocabulary, and speaking practice.

## Architecture

### Backend (NestJS + Prisma + PostgreSQL + Redis + BullMQ)

- **Modular Monolith** architecture
- **JWT Authentication** with refresh token rotation
- **Dynamic RBAC** permission system
- **Spaced Repetition** algorithm for flashcards
- **Queue-based** async processing with BullMQ
- **Redis** for caching and session management

### Frontend (Next.js + TypeScript + Tailwind + React Query + Zustand)

- **Feature-based** organization
- **Responsive** UI with shadcn/ui
- **Real-time** support with Socket.io
- **Type-safe** API layer

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | BullMQ |
| Storage | MinIO/S3 |
| Auth | JWT + Refresh Token |
| API Docs | Swagger |

## Features

### Core Features

- [x] User Authentication (Register, Login, Logout)
- [x] JWT with Refresh Token Rotation
- [x] Multi-device Session Management
- [x] Dynamic RBAC Permission System
- [x] Vocabulary Management
- [x] Flashcard System with Spaced Repetition
- [x] Quiz System
- [x] Grammar Lessons
- [x] Speaking Practice with audio recording
- [x] Analytics & Leaderboard
- [x] Notifications

### Backend Modules

- [x] `auth` - Authentication, JWT, Sessions
- [x] `users` - User management
- [x] `permissions` - RBAC, Roles, Permissions
- [x] `vocabulary` - Topics, Vocabulary items
- [x] `flashcards` - Flashcards, Reviews, Spaced Repetition
- [x] `quiz` - Quizzes, Questions, Answers
- [x] `grammar` - Grammar categories, lessons
- [x] `speaking` - Speaking exercises and audio attempts
- [x] `analytics` - User stats, leaderboard
- [x] `notifications` - In-app notifications
- [x] `admin` - Admin dashboard, user management

## Project Structure

```
english-learning-platform/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── permissions/
│   │   │   ├── vocabulary/
│   │   │   ├── flashcards/
│   │   │   ├── quiz/
│   │   │   ├── grammar/
│   │   │   ├── speaking/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   ├── common/
│   │   │   ├── constants/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   ├── queues/
│   │   └── websocket/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (main)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── vocabulary/
│   │   │   │   ├── flashcards/
│   │   │   │   ├── quizzes/
│   │   │   │   ├── grammar/
│   │   │   │   ├── speaking/
│   │   │   │   ├── leaderboard/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layouts/
│   │   │   └── ...
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── flashcards/
│   │   │   ├── vocabulary/
│   │   │   └── ...
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# Run backend only
docker-compose up -d backend
```

## Environment Variables

### Backend

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3001
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## API Documentation

After starting the backend, visit:
- Swagger UI: http://localhost:3000/api/docs

## Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |

## Development

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

## Architecture Decisions

### Why Modular Monolith?

- Simple to develop and deploy
- Easy to debug
- Can scale to hundreds of thousands of users
- Easy to extract microservices later if needed

### Why Spaced Repetition?

- Scientifically proven method for long-term retention
- Reduces study time while improving results
- Implemented using SM-2 algorithm variants

### Why JWT + Refresh Token?

- Stateless authentication for scalability
- Refresh token rotation for security
- Session tracking for multi-device support

## License

MIT
