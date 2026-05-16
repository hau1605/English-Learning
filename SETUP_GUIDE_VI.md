# Hướng Dẫn Setup Toàn Diện - English Learning Platform

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Setup môi trường cục bộ](#3-setup-môi-trường-cục-bộ)
4. [Docker Setup](#4-docker-setup)
5. [Database & Migration](#5-database--migration)
6. [Chạy ứng dụng](#6-chạy-ứng-dụng)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Testing](#8-testing)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [ Troubleshooting](#10-troubleshooting)

---

## 1. Yêu cầu hệ thống

### Phần mềm bắt buộc

| Phần mềm | Phiên bản tối thiểu | Mục đích |
|----------|---------------------|----------|
| Node.js | 20.x LTS | Runtime cho backend |
| npm | 10.x | Package manager |
| Docker | 24.x | Container hóa |
| Docker Compose | 2.x | Điều phối containers |
| Git | 2.x | Version control |
| PostgreSQL | 15.x | Database (qua Docker) |
| Redis | 7.x | Cache (qua Docker) |

### Khuyến nghị

- **OS**: macOS, Linux (Ubuntu 22.04+), hoặc Windows với WSL2
- **RAM**: Tối thiểu 8GB (16GB khuyến nghị)
- **Disk**: 20GB trống

---

## 2. Cấu trúc dự án

```
english-learning-platform/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── flashcards/
│   │   │   ├── quiz/
│   │   │   ├── speaking/
│   │   │   └── ...
│   │   ├── common/           # Shared utilities
│   │   └── prisma/           # Database client
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
│   └── package.json
│
├── infra/                     # Infrastructure
│   ├── prometheus/           # Metrics
│   ├── grafana/             # Dashboards
│   └── alerting/            # Alert rules
│
├── nginx/                     # Web server config
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docker-compose.yml         # Production compose
└── README.md
```

---

## 3. Setup môi trường cục bộ

### 3.1 Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd english-learning-platform

# Backend - Cài đặt dependencies
cd backend
npm install

# Frontend - Cài đặt dependencies
cd ../frontend
npm install
```

### 3.2 Copy file cấu hình môi trường

```bash
# Backend
cd backend
cp .env.example .env.development

# Frontend  
cd ../frontend
cp .env.example .env.local
```

### 3.3 Cấu hình file .env

**Backend** (`backend/.env.development`):

```env
# APPLICATION
PORT=3000
NODE_ENV=development

# DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT - THAY ĐỔI TRONG PRODUCTION!
JWT_SECRET=dev-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-key-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# FRONTEND
FRONTEND_URL=http://localhost:3681


# LOGGING
LOG_LEVEL=debug
ENABLE_SWAGGER=true
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## 4. Docker Setup

### 4.1 Chạy infrastructure với Docker Compose

```bash
# Từ thư mục gốc của project
docker-compose up -d postgres redis minio

# Kiểm tra containers đang chạy
docker-compose ps
```

### 4.2 Services được khởi tạo

| Service | Port | Mô tả |
|---------|------|-------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |
| minio | 9000, 9001 | S3-compatible storage |
| prometheus | 9090 | Metrics collection |
| grafana | 3001 | Dashboards |

### 4.3 Tạo MinIO bucket

Truy cập http://localhost:9001 (credentials: minioadmin/minioadmin) và tạo bucket `english-learning`.

---

## 5. Database & Migration

### 5.1 Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### 5.2 Chạy migrations

```bash
# Development - tạo migration mới
npm run prisma:migrate

# Hoặc push schema trực tiếp (không tạo migration)
npm run prisma:push
```

### 5.3 Seed database (tạo dữ liệu mẫu)

```bash
npm run prisma:seed
```

### 5.4 Mở Prisma Studio (GUI cho database)

```bash
npm run prisma:studio
```

---

## 6. Chạy ứng dụng

### 6.1 Chạy Backend (Development)

```bash
cd backend

# Development mode với hot reload
npm run start:dev

# Hoặc debug mode
npm run start:debug
```

Backend sẽ chạy tại http://localhost:3000
Swagger API docs: http://localhost:3000/api/docs

### 6.2 Chạy Frontend (Development)

```bash
cd frontend

# Development mode
npm run dev
```

Frontend sẽ chạy tại http://localhost:3681

### 6.3 Chạy toàn bộ với Docker Compose

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up --build

# Production environment
docker-compose up --build -d
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Workflows

#### CI Pipeline (`.github/workflows/ci.yml`)

Chạy tự động trên mọi push/PR vào main và develop:

1. **Lint** - Kiểm tra code style
2. **Type Check** - TypeScript compilation
3. **Test** - Unit tests với PostgreSQL và Redis
4. **Build** - Build production artifact

#### CD Pipeline (`.github/workflows/cd.yml`)

Chạy tự động khi push vào main:

1. Build và push Docker image lên GitHub Container Registry
2. Deploy lên Staging environment
3. Chạy smoke tests
4. Deploy lên Production (sau khi Staging thành công)

### 7.2 Cấu hình GitHub Secrets

Cần thiết lập trong GitHub repository Settings > Secrets:

| Secret | Mô tả |
|--------|-------|
| `SERVER_HOST` | SSH host cho deployment |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private SSH key |
| `GRAFANA_PASSWORD` | Grafana admin password |

### 7.3 Chạy CI/CD cục bộ

```bash
# Kiểm tra syntax workflow
npx act validate

# Chạy CI pipeline cục bộ
npx act -W .github/workflows/ci.yml
```

---

## 8. Testing

### 8.1 Backend Tests

```bash
cd backend

# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:cov

# Chạy e2e tests
npm run test:e2e
```

### 8.2 Frontend Type Check

```bash
cd frontend

# TypeScript check
npm run type-check

# ESLint
npm run lint
```

### 8.3 Test Coverage Report

Sau khi chạy `npm run test:cov`, report sẽ được tạo tại:

```
backend/coverage/
├── lcov-report/    # HTML report
└── lcov.info       # Cho Codecov integration
```

### 8.4 Smoke Tests (API)

```bash
# Health check
curl http://localhost:3000/health

# Sample API call
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

---

## 9. Monitoring & Logging

### 9.1 Prometheus Metrics

Truy cập: http://localhost:9090

Metrics được expose tại `/metrics` endpoint:
- HTTP request duration
- Database query times
- Cache hit/miss rates
- Business metrics (reviews, logins, etc.)

### 9.2 Grafana Dashboards

Truy cập: http://localhost:3001
Default credentials: `admin` / `admin`

Pre-configured dashboards:
- **Backend Overview** - Request rates, latencies, errors
- **System Health** - CPU, memory, disk usage

### 9.3 Logs

```bash
# Xem logs backend
docker-compose logs -f backend

# Xem logs với filter
docker-compose logs -f backend | grep ERROR
```

### 9.4 Alerting

Alerts được định nghĩa trong `infra/alerting/alerts.yml`:

- High error rate
- Slow response time
- Database connection issues
- Low disk space

---

## 10. Troubleshooting

### Lỗi thường gặp

#### 1. Database connection failed

```bash
# Kiểm tra PostgreSQL đang chạy
docker-compose ps postgres

# Reset database
docker-compose restart postgres
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS english_learning;"
npm run prisma:migrate
npm run prisma:seed
```

#### 2. Redis connection failed

```bash
# Kiểm tra Redis
docker-compose ps redis
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

#### 3. Prisma Client out of sync

```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

#### 4. Port already in use

```bash
# Tìm process đang dùng port
lsof -i :3000  # Backend
lsof -i :3681  # Frontend
lsof -i :5432  # PostgreSQL

# Hoặc dùng Docker
docker-compose down
docker-compose up -d
```

#### 5. MinIO bucket not found

```bash
# Tạo bucket thủ công
docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker-compose exec minio mc mb local/english-learning
docker-compose exec minio mc anonymous set public local/english-learning
```

### Lệnh hữu ích

```bash
# Reset toàn bộ environment
docker-compose down -v  # Xóa volumes
rm -rf backend/node_modules frontend/node_modules
npm install && cd ../frontend && npm install

# Build lại từ đầu
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Xem logs tất cả services
docker-compose logs -f

# Kiểm tra health của tất cả services
docker-compose ps
curl http://localhost:3000/health
curl http://localhost:9000/minio/health/live
redis-cli -h localhost -p 6379 ping
```

---

## Tài khoản mặc định

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |

---

## Liên hệ & Hỗ trợ

- Documentation: `/docs/`
- API Docs: http://localhost:3000/api/docs
- Issues: GitHub Issues

---

**Last updated: May 2026**
