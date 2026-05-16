# Development Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running Services](#running-services)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Testing](#testing)
- [Common Tasks](#common-tasks)

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js 20+
- npm or yarn
- Docker Desktop (for containerized development)
- Git

## Quick Start

### Option 1: Docker Development (Recommended)

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or use Make
make docker-up:dev
```

Services will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3681
- Swagger Docs: http://localhost:3000/api/docs
- MinIO Console: http://localhost:9001

### Option 2: Local Development

```bash
# 1. Install dependencies
make install

# 2. Set up environment
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development

# 3. Start infrastructure services
docker-compose -f docker-compose.dev.yml up postgres redis minio

# 4. Run database migrations
cd backend
npm run prisma:migrate
npm run prisma:generate

# 5. Start development servers
make dev
```

## Project Structure

```
english-learning-platform/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── environments/    # Environment-specific configs
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Shared utilities
│   │   └── ...
│   ├── prisma/             # Database schema
│   ├── .env.development    # Development environment
│   ├── .env.production     # Production environment
│   └── Dockerfile.dev      # Development Docker image
│
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/     # React components
│   │   └── ...
│   ├── .env.development   # Development environment
│   └── .env.production    # Production environment
│
├── nginx/                  # Nginx configurations
│   ├── nginx.dev.conf     # Development config
│   └── nginx.prod.conf    # Production config
│
├── docker-compose.dev.yml  # Development Docker setup
├── docker-compose.prod.yml # Production Docker setup
└── Makefile               # Development shortcuts
```

## Environment Setup

### Backend Environment

Create `backend/.env.development`:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT - Development secrets only
JWT_SECRET=dev-jwt-secret-key-change-in-production-32chars
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production-32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3681

# Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=english-learning

# Logging (verbose)
LOG_LEVEL=debug

# Security (relaxed for development)
ENABLE_HTTPS=false
TRUST_PROXY=false
ENABLE_SWAGGER=true
SECURE_COOKIE=false
```

### Frontend Environment

Create `frontend/.env.development`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3681
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
NEXT_PUBLIC_NODE_ENV=development
```

## Running Services

### Using Make

```bash
# Start everything
make dev

# Start only backend with hot reload
make dev:backend

# Start only frontend
make dev:frontend

# View logs
make logs:backend
make logs:docker
```

### Using npm Scripts

**Backend:**
```bash
cd backend

# Start with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Production-like start
npm run start:prod
```

**Frontend:**
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Start production build
npm run start
```

### Using Docker Compose

```bash
# Development mode
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down

# Clean up (removes volumes)
docker-compose -f docker-compose.dev.yml down -v

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Development Workflow

### 1. Creating New Features

```bash
# 1. Create a new branch
git checkout -b feature/my-new-feature

# 2. Generate Prisma schema changes (if needed)
cd backend
npm run prisma:migrate

# 3. Start development
make dev:backend

# 4. Implement your feature
# ... edit files ...

# 5. Test your changes
npm run test

# 6. Commit your changes
git add .
git commit -m "feat: add my new feature"
```

### 2. Database Changes

```bash
# Create a new migration
cd backend
npm run prisma:migrate

# Push schema changes (development only)
npm run prisma:push

# Open Prisma Studio
npm run prisma:studio

# Seed the database
npm run prisma:seed
```

### 3. Testing

```bash
# Backend tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # End-to-end tests

# Frontend type checking
cd frontend
npm run type-check
```

## Database Management

### Prisma Commands

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Push schema to database
npm run prisma:push

# Reset database
npm run prisma:migrate:reset

# Open database GUI
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Docker Database Access

```bash
# Connect to PostgreSQL
docker exec -it english-learning-db psql -U postgres -d english_learning

# Connect to Redis
docker exec -it english-learning-redis redis-cli

# View MinIO data
docker exec -it english-learning-minio ls /data
```

## Common Tasks

### Adding a New Environment Variable

1. Add to `backend/.env.development`:
```env
NEW_VARIABLE=value
```

2. Add to `backend/.env.production`:
```env
NEW_VARIABLE=production_value
```

3. Add validation in `backend/src/config/env.validation.ts`

4. Update `backend/src/main.ts` if needed for runtime behavior

### Adding a New Module

1. Create the module in `backend/src/modules/`
2. Register in `backend/src/app.module.ts`
3. Add routes in the module
4. Update Swagger documentation

### Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Or use Docker
docker-compose -f docker-compose.prod.yml build
```

### Troubleshooting

**Port already in use:**
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <pid> /F
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

**Clean slate:**
```bash
# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Reinstall node_modules
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

## Security Notes for Development

- Never commit `.env` files to git
- Use development secrets only in development
- Enable `ENABLE_SWAGGER=true` for API documentation
- CORS is configured for `localhost` only
- Database password is set to `postgres` (development only)

## Hot Reload Configuration

### Backend (NestJS)
The backend uses `nest start --watch` which automatically reloads on file changes.

### Frontend (Next.js)
Next.js hot module replacement (HMR) is enabled by default in development.

### Docker Volumes
The `docker-compose.dev.yml` mounts the `backend/src` directory for hot reload support when running backend in Docker.

## Next Steps

- Read the [Deployment Guide](./deployment.md) for production setup
- Configure SSL certificates for production
- Set up CI/CD pipelines
- Review security settings before going to production
