# English Learning Platform

A production-ready English learning platform with flashcards, quizzes, vocabulary, grammar lessons, speaking practice, and exam preparation (TOEIC, IELTS, VSTEP).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Database Management](#database-management)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Default Accounts](#default-accounts)
- [API Documentation](#api-documentation)

---

## Prerequisites

Ensure you have the following installed on your machine:

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 20+ | Yes |
| npm | 10+ | Yes |
| Docker | 24+ | Yes |
| Docker Compose | v2+ | Yes |
| Git | Latest | Optional |

**Services (via Docker):**
- PostgreSQL 15+ (database)
- Redis 7+ (caching & session)
- MinIO (S3-compatible storage)

> **Note:** This guide uses Docker Compose v2 syntax (`docker compose`). If you have the legacy CLI, replace with `docker-compose`.

---

## Architecture Overview

```
english-learning-platform/
├── backend/          # NestJS API
├── frontend/         # Next.js 14 App
├── nginx/            # Reverse proxy configs
├── infra/            # Infrastructure configs
├── crawler-service/  # Content crawler
└── docker-compose*.yml
```

### Backend Tech Stack
- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Database:** PostgreSQL 15
- **Cache:** Redis 7 + BullMQ (queues)
- **Auth:** JWT + Refresh Token Rotation
- **Storage:** MinIO/S3
- **Real-time:** Socket.io
- **API Docs:** Swagger/OpenAPI

### Frontend Tech Stack
- **Framework:** Next.js 14
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

---

## Project Structure

```
english-learning-platform/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication (JWT, sessions)
│   │   │   ├── users/         # User management
│   │   │   ├── permissions/    # RBAC (roles, permissions)
│   │   │   ├── vocabulary/     # Vocabulary & topics
│   │   │   ├── flashcards/     # Flashcards & spaced repetition
│   │   │   ├── quiz/          # Quiz system
│   │   │   ├── grammar/        # Grammar lessons
│   │   │   ├── speaking/       # Speaking practice
│   │   │   ├── analytics/      # Stats & leaderboard
│   │   │   ├── notifications/  # Notifications
│   │   │   ├── admin/         # Admin dashboard
│   │   │   └── exam/           # Exam practice (TOEIC/IELTS)
│   │   ├── common/            # Shared utilities
│   │   ├── prisma/            # Database schema
│   │   └── websocket/         # Real-time events
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Initial data
│   ├── Dockerfile             # Production image
│   └── Dockerfile.dev         # Development image (with hot reload)
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (auth)/        # Auth pages
│   │   │   └── (main)/        # Main app pages
│   │   ├── components/        # Shared components
│   │   ├── features/          # Feature modules
│   │   ├── services/          # API clients
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── nginx/                     # Nginx configurations
├── infra/                     # Monitoring configs
└── docker-compose*.yml        # Docker compose files
```

---

## Quick Start

### Option 1: Full Docker Stack (Simplest)

```bash
# 1. Clone and enter directory
git clone <repository-url>
cd english-learning-platform

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker compose -f docker-compose.yml up -d

# 4. Run database migrations (from host)
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Option 2: Local Development (Hot Reload)

```bash
# 1. Start infrastructure services
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

**Default URLs:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3681 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| MinIO Console | http://localhost:9001 |

---

## Development Setup

### Step-by-Step Guide

#### Step 1: Clone and Install

```bash
git clone <repository-url>
cd english-learning-platform
```

#### Step 2: Create Environment Files

**Root `.env`:**
```bash
cp .env.example .env
```

**Backend `.env`:**
```bash
cp backend/.env.example backend/.env
```

**Frontend `.env.local`:**
```bash
cp frontend/.env.example frontend/.env.local
```

On Windows PowerShell:
```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

#### Step 3: Configure Backend Environment

Edit `backend/.env`:

```env
# Application
PORT=3000
NODE_ENV=development

# Database - Connect to Docker service
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (change these in production!)
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production-32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3681

# Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=english-learning
S3_REGION=us-east-1
S3_PUBLIC_URL=http://localhost:9000

# Security (Development)
ENABLE_SWAGGER=true
SECURE_COOKIE=false
```

#### Step 4: Configure Frontend Environment

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3681
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_NODE_ENV=development
```

#### Step 5: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# Verify services are running
docker compose -f docker-compose.dev.yml ps
```

#### Step 6: Setup Backend Database

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create database schema
npm run prisma:migrate

# Seed initial data (roles, permissions, admin user, sample data)
npm run prisma:seed

# Start development server (with hot reload)
npm run start:dev
```

#### Step 7: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Step 8: Verify Installation

Open your browser and visit:
- **Frontend:** http://localhost:3681
- **Backend API:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api/docs
- **MinIO Console:** http://localhost:9001 (login: minioadmin/minioadmin)

Login with default credentials:
- **Email:** admin@example.com
- **Password:** Admin123!

---

## Production Setup

### Option 1: Docker-Based Production

This approach runs everything in Docker containers.

#### Step 1: Prepare Server

```bash
# SSH to your server
ssh user@your-server

# Install Docker and Docker Compose
# (refer to Docker official docs for your OS)

# Create project directory
mkdir -p /opt/english-learning
cd /opt/english-learning
```

#### Step 2: Upload Project Files

```bash
# Option A: Git clone
git clone <repository-url> .

# Option B: SCP/SCopy files
scp -r ./english-learning-platform/* user@your-server:/opt/english-learning/
```

#### Step 3: Configure Production Environment

```bash
# Create production .env file
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/english_learning

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT (MUST be strong secrets!)
JWT_SECRET=your-very-long-random-secret-at-least-32-characters
JWT_REFRESH_SECRET=another-very-long-random-secret-at-least-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URLs (replace with your domain)
FRONTEND_URL=https://your-domain.com
S3_PUBLIC_URL=https://your-domain.com

# MinIO/S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_BUCKET=english-learning
S3_REGION=us-east-1

# Security
ENABLE_HTTPS=true
TRUST_PROXY=true
ENABLE_SWAGGER=false
SECURE_COOKIE=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# SSL Certificates (optional, for Let's Encrypt)
# SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
# SSL_KEY_PATH=/etc/nginx/ssl/key.pem
EOF
```

#### Step 4: Generate SSL Certificates (Optional)

Using Let's Encrypt:

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Generate certificates (after nginx is running)
docker compose -f docker-compose.prod.yml up -d nginx
certbot certonly --webroot -w ./certbot/www -d your-domain.com

# Copy certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Step 5: Run Database Migrations

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations against production database
npx prisma migrate deploy

# Seed initial data
npm run prisma:seed
```

#### Step 6: Build and Start Services

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

#### Step 7: Setup MinIO Bucket

```bash
# Access MinIO Console at http://your-domain:9001
# Create bucket: english-learning
# Set bucket policy to public for uploads
```

### Option 2: Hybrid Production

Run PostgreSQL, Redis, and MinIO in Docker; run backend/frontend on host.

```bash
# Start infrastructure only
docker compose -f docker-compose.yml up -d postgres redis minio

# Configure .env with localhost for database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# Build backend
cd backend
npm install
npm run prisma:generate
npm run build
npm run start:prod

# Build frontend (in new terminal)
cd frontend
npm install
npm run build
npm start
```

---

## Database Management

### Migration Commands

All commands run from `backend/` directory.

```bash
# Generate Prisma client (after schema changes)
npm run prisma:generate

# Development: Create and apply migration
npm run prisma:migrate

# Production: Apply existing migrations only
npx prisma migrate deploy

# Reset database (DANGEROUS - deletes all data)
npx prisma migrate reset

# Push schema changes (without migration history)
npm run prisma:push

# Open Prisma Studio (visual database editor)
npm run prisma:studio
```

### Creating New Migrations

#### Step 1: Modify Schema

Edit `backend/prisma/schema.prisma`:

```prisma
model NewTable {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("new_tables")
}
```

#### Step 2: Create Migration

```bash
cd backend

# Create migration with name
npx prisma migrate dev --name add_new_table

# Or create empty migration for manual editing
npx prisma migrate dev --name add_new_table --create-only
```

#### Step 3: Apply Migration

**Development:**
```bash
npm run prisma:migrate
```

**Production:**
```bash
npx prisma migrate deploy
```

### Adding Columns/Relations

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_column_to_table

# 3. Generate client
npm run prisma:generate

# 4. For production, deploy migration
npx prisma migrate deploy
```

### Reset Database

```bash
# WARNING: This deletes ALL data!

# Development
npx prisma migrate reset

# Or with confirmation
npx prisma migrate reset --force

# Recreate everything
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Database Seeding

Seed data includes:
- Roles: Super Admin, Admin, Teacher, Student
- Permissions: Full RBAC system
- Menu items: Navigation structure
- Admin user: admin@example.com / Admin123!
- Sample vocabulary topics and words
- TOEIC exam structure

```bash
cd backend
npm run prisma:seed
```

---

## Docker Setup

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Infrastructure + backend (for hybrid dev) |
| `docker-compose.dev.yml` | Full development stack with hot reload |
| `docker-compose.prod.yml` | Production stack (no exposed ports) |

### Service Ports

| Service | Container Port | Host Port | Dev | Prod |
|---------|----------------|-----------|-----|------|
| PostgreSQL | 5432 | 5432 | Yes | No |
| Redis | 6379 | 6379 | Yes | No |
| MinIO API | 9000 | 9000 | Yes | Internal |
| MinIO Console | 9001 | 9001 | Yes | Internal |
| Backend API | 3000 | 3000 | Yes | Internal |
| Nginx | 80/443 | 80/443 | Yes | Yes |
| Prometheus | 9090 | 9090 | Yes | Yes |
| Grafana | 3000 | 3001 | Yes | Yes |

### Docker Commands

This section covers all docker-compose commands for managing your services.

#### Docker Compose File Reference

| File | Purpose | Services |
|------|---------|----------|
| `docker-compose.yml` | Infrastructure + backend (hybrid dev) | postgres, redis, minio, backend, nginx |
| `docker-compose.dev.yml` | Full development stack | All services + hot reload |
| `docker-compose.prod.yml` | Production stack | All services, no exposed ports |

#### Starting Services

```bash
# Start all services (detached/background)
docker compose -f docker-compose.dev.yml up -d

# Start specific services only
docker compose -f docker-compose.dev.yml up -d postgres redis

# Start with build (if Dockerfile changed)
docker compose -f docker-compose.dev.yml up --build -d

# Start in foreground (see logs live)
docker compose -f docker-compose.dev.yml up

# Start specific service with build
docker compose -f docker-compose.dev.yml up --build -d backend
```

#### Stopping Services

```bash
# Stop all services (keep containers and volumes)
docker compose -f docker-compose.dev.yml stop

# Stop specific service
docker compose -f docker-compose.dev.yml stop backend

# Stop and remove containers (keep volumes)
docker compose -f docker-compose.dev.yml down

# Stop and remove everything (including volumes - WARNING: deletes data!)
docker compose -f docker-compose.dev.yml down -v

# Remove containers only (not volumes or images)
docker compose -f docker-compose.dev.yml rm

# Force remove running containers
docker compose -f docker-compose.dev.yml rm -f
```

#### Viewing Logs

```bash
# View logs of all services
docker compose -f docker-compose.dev.yml logs

# View logs with follow (live streaming)
docker compose -f docker-compose.dev.yml logs -f

# View logs of specific service
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f nginx

# View last 100 lines of specific service
docker compose -f docker-compose.dev.yml logs --tail=100 backend

# View logs with timestamp
docker compose -f docker-compose.dev.yml logs -t backend

# Combine options
docker compose -f docker-compose.dev.yml logs -f --tail=50 --timestamps backend
```

#### Rebuilding Services

```bash
# Rebuild all services without starting
docker compose -f docker-compose.dev.yml build

# Rebuild specific service
docker compose -f docker-compose.dev.yml build backend

# Rebuild without cache (clean build)
docker compose -f docker-compose.dev.yml build --no-cache backend

# Rebuild and start service
docker compose -f docker-compose.dev.yml up --build -d backend

# Pull latest images without building
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml pull postgres redis
```

#### Managing Containers

```bash
# List running containers
docker compose -f docker-compose.dev.yml ps

# List all containers (including stopped)
docker compose -f docker-compose.dev.yml ps -a

# Start specific container
docker compose -f docker-compose.dev.yml start backend

# Stop specific container
docker compose -f docker-compose.dev.yml stop backend

# Restart specific container
docker compose -f docker-compose.dev.yml restart backend

# Pause container (freeze)
docker compose -f docker-compose.dev.yml pause backend

# Unpause container
docker compose -f docker-compose.dev.yml unpause backend
```

#### Executing Commands Inside Containers

```bash
# Open shell in container
docker exec -it english-learning-api-dev sh
docker exec -it english-learning-db-dev sh

# Run command in container
docker exec english-learning-api-dev npm run prisma:generate
docker exec english-learning-db-dev psql -U postgres -d english_learning

# Copy files from container
docker cp english-learning-api-dev:/app/dist ./backup-dist

# Copy files to container
docker cp ./local-file.txt english-learning-api-dev:/app/
```

#### Database Operations

```bash
# Run Prisma commands in backend container
docker exec english-learning-api-dev npx prisma migrate deploy
docker exec english-learning-api-dev npx prisma generate
docker exec english-learning-api-dev npm run prisma:seed

# PostgreSQL operations
docker exec english-learning-db pg_isready -U postgres
docker exec english-learning-db psql -U postgres -d english_learning -c "SELECT * FROM users;"

# Backup database
docker exec english-learning-db pg_dump -U postgres english_learning > backup.sql

# Restore database
cat backup.sql | docker exec -i english-learning-db psql -U postgres english_learning
```

#### Redis Operations

```bash
# Test Redis connection
docker exec english-learning-redis-dev redis-cli ping
# Expected output: PONG

# Open Redis CLI
docker exec -it english-learning-redis-dev redis-cli

# View Redis info
docker exec english-learning-redis-dev redis-cli info

# Flush Redis cache (WARNING!)
docker exec english-learning-redis-dev redis-cli FLUSHALL
```

#### MinIO Operations

```bash
# Create bucket via mc client
docker exec english-learning-minio-dev mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec english-learning-minio-dev mc mb local/english-learning

# Set bucket public policy
docker exec english-learning-minio-dev mc anonymous set download local/english-learning

# List buckets
docker exec english-learning-minio-dev mc ls local/

# List objects in bucket
docker exec english-learning-minio-dev mc ls local/english-learning/
```

#### Checking Service Health

```bash
# Check health of all services
docker compose -f docker-compose.dev.yml ps

# Inspect service details
docker inspect english-learning-api-dev
docker inspect english-learning-db-dev

# View resource usage
docker stats
docker stats english-learning-api-dev english-learning-db-dev

# View processes in container
docker exec english-learning-api-dev ps aux
```

#### Restarting Services

```bash
# Restart all services
docker compose -f docker-compose.dev.yml restart

# Restart specific service
docker compose -f docker-compose.dev.yml restart backend

# Restart with build
docker compose -f docker-compose.dev.yml up -d --build backend
```

#### Scaling Services

```bash
# Scale backend to 3 instances
docker compose -f docker-compose.dev.yml up -d --scale backend=3

# Scale down
docker compose -f docker-compose.dev.yml up -d --scale backend=1
```

> **Note:** Requires load balancer for scaling. The default setup doesn't include this.

#### Configuration Validation

```bash
# Validate compose file
docker compose -f docker-compose.dev.yml config

# Validate and show merged configuration
docker compose -f docker-compose.dev.yml config --quiet

# List environment variables
docker compose -f docker-compose.dev.yml env
```

#### Cleanup and Maintenance

```bash
# Remove unused images
docker image prune -f

# Remove all unused containers, networks, and images
docker system prune -f

# Remove all volumes (WARNING: deletes all data!)
docker system prune --volumes -f

# Remove stopped containers and unused volumes
docker compose -f docker-compose.dev.yml down --remove-orphans

# Clean rebuild everything
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml up --build -d
```

#### Common Development Workflow

```bash
# First time setup
docker compose -f docker-compose.dev.yml up -d postgres redis minio
cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
docker compose -f docker-compose.dev.yml up --build -d backend

# Daily development
docker compose -f docker-compose.dev.yml up -d          # Start services
docker compose -f docker-compose.dev.yml logs -f         # Watch logs
# ... make code changes (hot reload enabled) ...
docker compose -f docker-compose.dev.yml down            # End of day

# After pulling new code
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml up --build -d

# Reset everything
docker compose -f docker-compose.dev.yml down -v
cd backend && npm run prisma:migrate && npm run prisma:seed
docker compose -f docker-compose.dev.yml up -d
```

#### Production Workflow

```bash
# Deploy
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Update (rebuild and restart)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up --build -d

# Rollback (restart with current image)
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# Full maintenance shutdown
docker compose -f docker-compose.prod.yml down
# ... perform maintenance ...
docker compose -f docker-compose.prod.yml up -d
```

### Creating Custom Docker Images

#### Backend Production Dockerfile

The backend Dockerfile (`backend/Dockerfile`) uses multi-stage build:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
CMD ["node", "dist/main"]
```

#### Backend Development Dockerfile

The development Dockerfile (`backend/Dockerfile.dev`) enables hot reload:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm install -g ts-node
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

### Building Docker Images

This section covers how to build Docker images independently (without docker-compose).

#### Build Backend Image

```bash
# Navigate to backend directory
cd backend

# Build production image
docker build -t english-learning-backend:latest .

# Build with custom tag
docker build -t your-registry.com/english-learning-backend:v1.0.0 .

# Build with build arguments
docker build \
  --build-arg NODE_ENV=production \
  -t english-learning-backend:prod .

# Build for specific platform (Linux/amd64)
docker build --platform linux/amd64 -t english-learning-backend:latest .
```

#### Build Backend Image (Development with Hot Reload)

```bash
# Build development image
docker build -f Dockerfile.dev -t english-learning-backend:dev .

# Run with volume mount for hot reload
docker run -d \
  --name english-backend-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/prisma:/app/prisma \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/english_learning \
  english-learning-backend:dev
```

> **Note:** On Windows, use `%cd%` instead of `$(pwd)`.

#### Build Frontend Image

Create a Dockerfile for frontend at `frontend/Dockerfile`:

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3681
ENV PORT=3681
CMD ["node", "server.js"]
```

Build the frontend image:

```bash
cd frontend

# Build production image
docker build -t english-learning-frontend:latest .

# Run frontend container
docker run -d \
  --name english-frontend \
  -p 3681:3681 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 \
  english-learning-frontend:latest
```

#### Multi-Stage Build for Smaller Images

```bash
# Build and show build time
docker build -t english-learning-backend:latest --progress=plain . 2>&1 | tail -20

# Build with no-cache (fresh dependencies)
docker build --no-cache -t english-learning-backend:latest .

# Build with cache (faster builds)
docker build -t english-learning-backend:latest .
```

#### Build Arguments Reference

| Argument | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Build environment |
| `npm_config Production` | true | Skip dev dependencies |

---

### Pushing Images to Registry

#### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag english-learning-backend:latest yourusername/english-learning-backend:latest

# Push to Docker Hub
docker push yourusername/english-learning-backend:latest

# Push with version tag
docker tag english-learning-backend:latest yourusername/english-learning-backend:v1.0.0
docker push yourusername/english-learning-backend:v1.0.0
```

#### Amazon ECR

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag english-learning-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/english-learning-backend:latest

# Push to ECR
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/english-learning-backend:latest
```

#### Google Container Registry (GCR)

```bash
# Login to GCR
gcloud auth configure-docker

# Tag and push
docker tag english-learning-backend:latest gcr.io/your-project/english-learning-backend:latest
docker push gcr.io/your-project/english-learning-backend:latest
```

#### Private Registry

```bash
# Login to private registry
docker login your-registry.com

# Tag and push
docker tag english-learning-backend:latest your-registry.com/english-learning-backend:latest
docker push your-registry.com/english-learning-backend:latest
```

---

### Multi-Architecture Build

Build images for multiple architectures (amd64, arm64):

```bash
# Using buildx (requires Docker BuildKit)
docker buildx create --use
docker buildx inspect --bootstrap

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry.com/english-learning-backend:latest \
  --push \
  .

# Build and load to local Docker (for testing)
docker buildx build \
  --platform linux/amd64 \
  -t english-learning-backend:amd64 \
  --load \
  .
```

> **Prerequisites:** Enable Docker BuildKit: `export DOCKER_BUILDKIT=1`

---

### Building All Images (CI/CD)

Create a build script for your CI/CD pipeline:

```bash
#!/bin/bash
# build-images.sh

set -e

REGISTRY=${1:-your-registry.com}
VERSION=${2:-latest}

echo "Building images..."
echo "Registry: $REGISTRY"
echo "Version: $VERSION"

# Build backend
echo "Building backend..."
cd backend
docker build -t ${REGISTRY}/english-learning-backend:${VERSION} .
docker tag ${REGISTRY}/english-learning-backend:${VERSION} ${REGISTRY}/english-learning-backend:latest

# Build frontend
echo "Building frontend..."
cd ../frontend
docker build -t ${REGISTRY}/english-learning-frontend:${VERSION} .
docker tag ${REGISTRY}/english-learning-frontend:${VERSION} ${REGISTRY}/english-learning-frontend:latest

# Push images
echo "Pushing images..."
docker push ${REGISTRY}/english-learning-backend:${VERSION}
docker push ${REGISTRY}/english-learning-backend:latest
docker push ${REGISTRY}/english-learning-frontend:${VERSION}
docker push ${REGISTRY}/english-learning-frontend:latest

echo "Done!"
```

Usage:

```bash
# Build and push to registry
./build-images.sh your-registry.com v1.0.0

# Build only (without push)
REGISTRY=local ./build-images.sh
```

---

### Image Size Optimization

Reduce Docker image size:

```bash
# Use multi-stage build (already implemented)
# Use alpine-based images (already implemented)
# Use .dockerignore file
```

Create `backend/.dockerignore`:

```
node_modules
.git
.gitignore
*.md
dist
.env*
coverage
test
tests
*.log
```

Create `frontend/.dockerignore`:

```
node_modules
.git
.gitignore
*.md
.next
out
coverage
test
tests
*.log
```

---

### Volume Management

Docker volumes persist data between container restarts.

```bash
# List volumes
docker volume ls | grep english

# Inspect volume
docker volume inspect english-learning-platform_postgres_data

# Backup database
docker exec english-learning-db pg_dump -U postgres english_learning > backup.sql

# Restore database
docker exec -i english-learning-db psql -U postgres english_learning < backup.sql
```

---

## Environment Variables

### Backend Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | - | Redis password (optional) |
| `JWT_SECRET` | - | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | - | Refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token expiry |
| `FRONTEND_URL` | - | Frontend URL for CORS |
| `S3_ENDPOINT` | - | MinIO/S3 endpoint |
| `S3_ACCESS_KEY` | - | Storage access key |
| `S3_SECRET_KEY` | - | Storage secret key |
| `S3_BUCKET` | english-learning | Storage bucket name |
| `S3_REGION` | us-east-1 | Storage region |
| `S3_PUBLIC_URL` | - | Public URL for files |
| `ENABLE_HTTPS` | false | Enable HTTPS mode |
| `TRUST_PROXY` | false | Trust proxy headers |
| `ENABLE_SWAGGER` | true | Enable Swagger docs |
| `SECURE_COOKIE` | false | Secure cookie flag |

### Frontend Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `NEXT_PUBLIC_NODE_ENV` | Environment (development/production) |
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Enable AI features |

---

## Common Commands

### Backend Commands

```bash
cd backend

# Development
npm run start:dev         # Start with hot reload
npm run start:debug       # Start with debugger
npm run start:prod        # Start production build

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Create/apply migrations
npm run prisma:push       # Push schema (no migration)
npm run prisma:seed       # Seed database
npm run prisma:studio     # Visual database editor

# Code Quality
npm run lint              # Lint code
npm run format            # Format code
npm run typecheck         # TypeScript check

# Testing
npm test                  # Run tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev               # Start dev server (port 3681)
npm run dev:prod          # Start with production mode

# Production
npm run build             # Build for production
npm start                 # Start production server
npm run start:prod        # Start production server

# Code Quality
npm run lint              # Lint code
npm run format            # Format code
npm run type-check        # TypeScript check

# Testing
npm test                  # Run tests (Vitest)
npm run test:unit         # Unit tests
npm run test:e2e          # E2E tests (Playwright)
```

### Docker Commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f

# Production
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml logs -f

# Cleanup
docker compose -f docker-compose.dev.yml down -v   # Remove volumes
docker compose -f docker-compose.prod.yml down -v

# List containers
docker compose -f docker-compose.dev.yml ps

# Shell into container
docker exec -it english-learning-api-dev sh
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   docker compose -f docker-compose.dev.yml ps postgres
   ```

2. Verify DATABASE_URL in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning
   ```

3. Check if port 5432 is available:
   ```bash
   netstat -an | grep 5432
   ```

### Prisma Client Not Generated

```bash
cd backend
npm run prisma:generate
```

### Migration Failures

**Error:** `Migration not found` or `Already at target migration`

**Solutions:**
1. Check migration history:
   ```bash
   npx prisma migrate status
   ```

2. For development, reset migrations:
   ```bash
   npx prisma migrate reset --force
   npm run prisma:migrate
   npm run prisma:seed
   ```

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process or change port in .env
```

### Docker Container Issues

```bash
# View container logs
docker compose -f docker-compose.dev.yml logs backend

# Restart container
docker compose -f docker-compose.dev.yml restart backend

# Rebuild from scratch
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### MinIO Access Issues

1. Access MinIO Console at http://localhost:9001
2. Default credentials: minioadmin/minioadmin
3. Create bucket: `english-learning`
4. Set bucket policy for public access

### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it english-learning-redis-dev redis-cli ping
# Should return: PONG
```

### Clean Development Setup

If starting fresh:

```bash
# 1. Stop and remove everything
docker compose -f docker-compose.dev.yml down -v

# 2. Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# 3. Clear Prisma cache
rm -rf backend/node_modules/.prisma

# 4. Fresh install
cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed

# 5. Start fresh
docker compose -f docker-compose.dev.yml up -d
```

---

## Default Accounts

After seeding, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |

**Note:** Change the admin password immediately in production!

---

## API Documentation

Once the backend is running, access:
- **Swagger UI:** http://localhost:3000/api/docs
- **ReDoc:** http://localhost:3000/api/docs (alternative)

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/logout | Logout |
| POST | /api/v1/auth/refresh | Refresh tokens |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password |
| GET | /api/v1/auth/google | Google OAuth login |
| GET | /api/v1/auth/google/callback | Google OAuth callback |

---

## Health Check

```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Database connection
curl http://localhost:3000/api/v1/health/db

# Redis connection
curl http://localhost:3000/api/v1/health/redis
```

---

## License

MIT
