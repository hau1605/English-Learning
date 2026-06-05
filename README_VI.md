# Nền Tảng Học Tiếng Anh - English Learning Platform

Nền tảng học tiếng Anh sản xuất với flashcards, bài kiểm tra, từ vựng, ngữ pháp, luyện nói và luyện thi (TOEIC, IELTS, VSTEP).

## Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Tổng Quan Kiến Trúc](#tổng-quan-kiến-trúc)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Khởi Động Nhanh](#khởi-động-nhanh)
- [Cài Đặt Môi Trường Development](#cài-đặt-môi-trường-development)
- [Cài Đặt Môi Trường Production](#cài-đặt-môi-trường-production)
- [Quản Lý Database](#quản-lý-database)
- [Cài Đặt Docker](#cài-đặt-docker)
- [Biến Môi Trường](#biến-môi-trường)
- [Các Lệnh Thường Dùng](#các-lệnh-thường-dùng)
- [Xử Lý Lỗi Thường Gặp](#xử-lý-lỗi-thường-gặp)
- [Tài Khoản Mặc Định](#tài-khoản-mặc-định)
- [Tài Liệu API](#tài-liệu-api)

---

## Yêu Cầu Hệ Thống

Đảm bảo các công cụ sau đã được cài đặt:

| Công Cụ | Phiên Bản | Bắt Buộc |
|---------|-----------|-----------|
| Node.js | 20+ | Có |
| npm | 10+ | Có |
| Docker | 24+ | Có |
| Docker Compose | v2+ | Có |
| Git | Mới nhất | Tùy chọn |

**Các dịch vụ (qua Docker):**
- PostgreSQL 15+ (cơ sở dữ liệu)
- Redis 7+ (cache & session)
- MinIO (lưu trữ tương thích S3)

> **Lưu ý:** Hướng dẫn này sử dụng cú pháp Docker Compose v2 (`docker compose`). Nếu bạn có CLI cũ, thay thế bằng `docker-compose`.

---

## Tổng Quan Kiến Trúc

```
english-learning-platform/
├── backend/          # API NestJS
├── frontend/         # Next.js 14 App
├── nginx/            # Cấu hình reverse proxy
├── infra/            # Cấu hình hạ tầng
├── crawler-service/  # Dịch vụ thu thập nội dung
└── docker-compose*.yml
```

### Backend Tech Stack
- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Database:** PostgreSQL 15
- **Cache:** Redis 7 + BullMQ (hàng đợi)
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

## Cấu Trúc Dự Án

```
english-learning-platform/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Xác thực (JWT, sessions)
│   │   │   ├── users/         # Quản lý người dùng
│   │   │   ├── permissions/    # RBAC (vai trò, quyền hạn)
│   │   │   ├── vocabulary/     # Từ vựng & chủ đề
│   │   │   ├── flashcards/     # Flashcards & spaced repetition
│   │   │   ├── quiz/          # Hệ thống bài kiểm tra
│   │   │   ├── grammar/        # Bài học ngữ pháp
│   │   │   ├── speaking/       # Luyện nói
│   │   │   ├── analytics/      # Thống kê & bảng xếp hạng
│   │   │   ├── notifications/  # Thông báo
│   │   │   ├── admin/         # Dashboard quản trị
│   │   │   └── exam/           # Luyện thi (TOEIC/IELTS)
│   │   ├── common/            # Tiện ích chia sẻ
│   │   ├── prisma/            # Schema database
│   │   └── websocket/         # Sự kiện real-time
│   ├── prisma/
│   │   ├── schema.prisma      # Schema database
│   │   └── seed.ts            # Dữ liệu ban đầu
│   ├── Dockerfile             # Image production
│   └── Dockerfile.dev         # Image development (hot reload)
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (auth)/        # Trang xác thực
│   │   │   └── (main)/        # Trang chính
│   │   ├── components/        # Component chia sẻ
│   │   ├── features/          # Module tính năng
│   │   ├── services/          # API clients
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── nginx/                     # Cấu hình Nginx
├── infra/                     # Cấu hình monitoring
└── docker-compose*.yml        # Docker compose files
```

---

## Khởi Động Nhanh

### Cách 1: Full Docker Stack (Đơn Giản Nhất)

```bash
# 1. Clone và vào thư mục
git clone <repository-url>
cd english-learning-platform

# 2. Tạo file môi trường
cp .env.example .env

# 3. Khởi động tất cả services
docker compose -f docker-compose.yml up -d

# 4. Chạy migration database (từ máy host)
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Cách 2: Local Development (Hot Reload)

```bash
# 1. Khởi động các dịch vụ hạ tầng
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# 2. Cài đặt Backend
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# 3. Frontend (terminal mới)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

**URLs Mặc Định:**

| Dịch Vụ | URL |
|---------|-----|
| Frontend | http://localhost:3681 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| MinIO Console | http://localhost:9001 |

---

## Cài Đặt Môi Trường Development

### Hướng Dẫn Từng Bước

#### Bước 1: Clone và Cài Đặt

```bash
git clone <repository-url>
cd english-learning-platform
```

#### Bước 2: Tạo Các File Môi Trường

**File `.env` ở root:**
```bash
cp .env.example .env
```

**File `.env` cho Backend:**
```bash
cp backend/.env.example backend/.env
```

**File `.env.local` cho Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
```

Trên Windows PowerShell:
```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

#### Bước 3: Cấu Hình Backend Environment

Chỉnh sửa `backend/.env`:

```env
# Application
PORT=3000
NODE_ENV=development

# Database - Kết nối đến Docker service
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (thay đổi trong production!)
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

#### Bước 4: Cấu Hình Frontend Environment

Chỉnh sửa `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3681
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_NODE_ENV=development
```

#### Bước 5: Khởi Động Các Dịch Vụ Hạ Tầng

```bash
# Khởi động PostgreSQL, Redis, và MinIO
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# Kiểm tra các services đang chạy
docker compose -f docker-compose.dev.yml ps
```

#### Bước 6: Cài Đặt Backend Database

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo Prisma client
npm run prisma:generate

# Tạo database schema
npm run prisma:migrate

# Tạo dữ liệu ban đầu (vai trò, quyền, admin user, dữ liệu mẫu)
npm run prisma:seed

# Khởi động server development (với hot reload)
npm run start:dev
```

#### Bước 7: Cài Đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động development server
npm run dev
```

#### Bước 8: Xác Minh Cài Đặt

Mở trình duyệt và truy cập:
- **Frontend:** http://localhost:3681
- **Backend API:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api/docs
- **MinIO Console:** http://localhost:9001 (đăng nhập: minioadmin/minioadmin)

Đăng nhập với tài khoản mặc định:
- **Email:** admin@example.com
- **Password:** Admin123!

---

## Cài Đặt Môi Trường Production

### Cách 1: Docker-Based Production

Cách này chạy tất cả trong các Docker containers.

#### Bước 1: Chuẩn Bị Server

```bash
# SSH đến server
ssh user@your-server

# Cài đặt Docker và Docker Compose
# (tham khảo tài liệu Docker chính thức cho OS của bạn)

# Tạo thư mục project
mkdir -p /opt/english-learning
cd /opt/english-learning
```

#### Bước 2: Upload Project Files

```bash
# Cách A: Git clone
git clone <repository-url> .

# Cách B: SCP/Sao chép files
scp -r ./english-learning-platform/* user@your-server:/opt/english-learning/
```

#### Bước 3: Cấu Hình Production Environment

```bash
# Tạo file .env production
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/english_learning

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT (BẮT BUỘC phải mạnh!)
JWT_SECRET=your-very-long-random-secret-at-least-32-characters
JWT_REFRESH_SECRET=another-very-long-random-secret-at-least-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URLs (thay bằng domain của bạn)
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

# SSL Certificates (tùy chọn, cho Let's Encrypt)
# SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
# SSL_KEY_PATH=/etc/nginx/ssl/key.pem
EOF
```

#### Bước 4: Tạo SSL Certificates (Tùy Chọn)

Sử dụng Let's Encrypt:

```bash
# Cài đặt certbot
apt install certbot python3-certbot-nginx

# Tạo certificates (sau khi nginx đang chạy)
docker compose -f docker-compose.prod.yml up -d nginx
certbot certonly --webroot -w ./certbot/www -d your-domain.com

# Sao chép certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Bước 5: Chạy Database Migrations

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo Prisma client
npm run prisma:generate

# Chạy migrations vào production database
npx prisma migrate deploy

# Tạo dữ liệu ban đầu
npm run prisma:seed
```

#### Bước 6: Build và Khởi Động Services

```bash
# Khởi động tất cả services
docker compose -f docker-compose.prod.yml up -d

# Kiểm tra status
docker compose -f docker-compose.prod.yml ps

# Xem logs
docker compose -f docker-compose.prod.yml logs -f backend
```

#### Bước 7: Thiết Lập MinIO Bucket

```bash
# Truy cập MinIO Console tại http://your-domain:9001
# Tạo bucket: english-learning
# Đặt bucket policy thành public cho uploads
```

### Cách 2: Hybrid Production

Chạy PostgreSQL, Redis, và MinIO trong Docker; chạy backend/frontend trên máy host.

```bash
# Khởi động chỉ infrastructure
docker compose -f docker-compose.yml up -d postgres redis minio

# Cấu hình .env với localhost cho database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning

# Build backend
cd backend
npm install
npm run prisma:generate
npm run build
npm run start:prod

# Build frontend (terminal mới)
cd frontend
npm install
npm run build
npm start
```

---

## Quản Lý Database

### Các Lệnh Migration

Tất cả các lệnh chạy từ thư mục `backend/`.

```bash
# Tạo Prisma client (sau khi thay đổi schema)
npm run prisma:generate

# Development: Tạo và apply migration
npm run prisma:migrate

# Production: Chỉ apply migration đã có
npx prisma migrate deploy

# Reset database (NGUY HIỂM - xóa tất cả dữ liệu)
npx prisma migrate reset

# Push schema (không có migration history)
npm run prisma:push

# Mở Prisma Studio (trình chỉnh sửa database trực quan)
npm run prisma:studio
```

### Tạo Migration Mới

#### Bước 1: Sửa Schema

Chỉnh sửa `backend/prisma/schema.prisma`:

```prisma
model NewTable {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("new_tables")
}
```

#### Bước 2: Tạo Migration

```bash
cd backend

# Tạo migration với tên
npx prisma migrate dev --name add_new_table

# Hoặc tạo migration rỗng để chỉnh sửa thủ công
npx prisma migrate dev --name add_new_table --create-only
```

#### Bước 3: Apply Migration

**Development:**
```bash
npm run prisma:migrate
```

**Production:**
```bash
npx prisma migrate deploy
```

### Thêm Columns/Relations

```bash
# 1. Cập nhật schema.prisma
# 2. Tạo migration
npx prisma migrate dev --name add_column_to_table

# 3. Tạo client
npm run prisma:generate

# 4. Cho production, deploy migration
npx prisma migrate deploy
```

### Reset Database

```bash
# CẢNH BÁO: Xóa TẤT CẢ dữ liệu!

# Development
npx prisma migrate reset

# Hoặc không cần xác nhận
npx prisma migrate reset --force

# Tạo lại tất cả
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Database Seeding

Dữ liệu seed bao gồm:
- Roles: Super Admin, Admin, Teacher, Student
- Permissions: Hệ thống RBAC đầy đủ
- Menu items: Cấu trúc điều hướng
- Admin user: admin@example.com / Admin123!
- Sample vocabulary topics và words
- Cấu trúc bài thi TOEIC

```bash
cd backend
npm run prisma:seed
```

---

## Cài Đặt Docker

### Các File Docker Compose

| File | Mục đích |
|------|----------|
| `docker-compose.yml` | Infrastructure + backend (cho hybrid dev) |
| `docker-compose.dev.yml` | Full development stack với hot reload |
| `docker-compose.prod.yml` | Production stack (không expose ports) |

### Các Port Dịch Vụ

| Dịch Vụ | Container Port | Host Port | Dev | Prod |
|---------|----------------|-----------|-----|------|
| PostgreSQL | 5432 | 5432 | Yes | No |
| Redis | 6379 | 6379 | Yes | No |
| MinIO API | 9000 | 9000 | Yes | Internal |
| MinIO Console | 9001 | 9001 | Yes | Internal |
| Backend API | 3000 | 3000 | Yes | Internal |
| Nginx | 80/443 | 80/443 | Yes | Yes |
| Prometheus | 9090 | 9090 | Yes | Yes |
| Grafana | 3000 | 3001 | Yes | Yes |

### Các Lệnh Docker

Phần này hướng dẫn tất cả các lệnh docker-compose để quản lý services.

#### Docker Compose File Reference

| File | Mục đích | Services |
|------|----------|----------|
| `docker-compose.yml` | Infrastructure + backend (hybrid dev) | postgres, redis, minio, backend, nginx |
| `docker-compose.dev.yml` | Full development stack | All services + hot reload |
| `docker-compose.prod.yml` | Production stack | All services, no exposed ports |

#### Khởi Động Services

```bash
# Khởi động tất cả services (detached/background)
docker compose -f docker-compose.dev.yml up -d

# Khởi động chỉ services cụ thể
docker compose -f docker-compose.dev.yml up -d postgres redis

# Khởi động với build (nếu Dockerfile thay đổi)
docker compose -f docker-compose.dev.yml up --build -d

# Khởi động trong foreground (xem logs trực tiếp)
docker compose -f docker-compose.dev.yml up

# Khởi động service cụ thể với build
docker compose -f docker-compose.dev.yml up --build -d backend
```

#### Dừng Services

```bash
# Dừng tất cả services (giữ containers và volumes)
docker compose -f docker-compose.dev.yml stop

# Dừng service cụ thể
docker compose -f docker-compose.dev.yml stop backend

# Dừng và xóa containers (giữ volumes)
docker compose -f docker-compose.dev.yml down

# Dừng và xóa tất cả (bao gồm volumes - CẢNH BÁO: xóa data!)
docker compose -f docker-compose.dev.yml down -v

# Chỉ xóa containers (không xóa volumes hoặc images)
docker compose -f docker-compose.dev.yml rm

# Force remove containers đang chạy
docker compose -f docker-compose.dev.yml rm -f
```

#### Xem Logs

```bash
# Xem logs của tất cả services
docker compose -f docker-compose.dev.yml logs

# Xem logs với follow (stream trực tiếp)
docker compose -f docker-compose.dev.yml logs -f

# Xem logs của service cụ thể
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f nginx

# Xem 100 dòng cuối của service cụ thể
docker compose -f docker-compose.dev.yml logs --tail=100 backend

# Xem logs với timestamp
docker compose -f docker-compose.dev.yml logs -t backend

# Kết hợp các tùy chọn
docker compose -f docker-compose.dev.yml logs -f --tail=50 --timestamps backend
```

#### Rebuild Services

```bash
# Rebuild tất cả services không khởi động
docker compose -f docker-compose.dev.yml build

# Rebuild service cụ thể
docker compose -f docker-compose.dev.yml build backend

# Rebuild không cache (clean build)
docker compose -f docker-compose.dev.yml build --no-cache backend

# Rebuild và khởi động service
docker compose -f docker-compose.dev.yml up --build -d backend

# Pull images mới nhất không build
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml pull postgres redis
```

#### Quản Lý Containers

```bash
# Liệt kê containers đang chạy
docker compose -f docker-compose.dev.yml ps

# Liệt kê tất cả containers (bao gồm stopped)
docker compose -f docker-compose.dev.yml ps -a

# Khởi động container cụ thể
docker compose -f docker-compose.dev.yml start backend

# Dừng container cụ thể
docker compose -f docker-compose.dev.yml stop backend

# Restart container cụ thể
docker compose -f docker-compose.dev.yml restart backend

# Pause container (freeze)
docker compose -f docker-compose.dev.yml pause backend

# Unpause container
docker compose -f docker-compose.dev.yml unpause backend
```

#### Thực Thi Lệnh Trong Container

```bash
# Mở shell trong container
docker exec -it english-learning-api-dev sh
docker exec -it english-learning-db-dev sh

# Chạy lệnh trong container
docker exec english-learning-api-dev npm run prisma:generate
docker exec english-learning-db-dev psql -U postgres -d english_learning

# Copy files từ container
docker cp english-learning-api-dev:/app/dist ./backup-dist

# Copy files vào container
docker cp ./local-file.txt english-learning-api-dev:/app/
```

#### Các Thao Tác Database

```bash
# Chạy Prisma commands trong backend container
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

#### Các Thao Tác Redis

```bash
# Test Redis connection
docker exec english-learning-redis-dev redis-cli ping
# Expected output: PONG

# Mở Redis CLI
docker exec -it english-learning-redis-dev redis-cli

# Xem Redis info
docker exec english-learning-redis-dev redis-cli info

# Flush Redis cache (CẢNH BÁO!)
docker exec english-learning-redis-dev redis-cli FLUSHALL
```

#### Các Thao Tác MinIO

```bash
# Tạo bucket qua mc client
docker exec english-learning-minio-dev mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec english-learning-minio-dev mc mb local/english-learning

# Đặt bucket public policy
docker exec english-learning-minio-dev mc anonymous set download local/english-learning

# Liệt kê buckets
docker exec english-learning-minio-dev mc ls local/

# Liệt kê objects trong bucket
docker exec english-learning-minio-dev mc ls local/english-learning/
```

#### Kiểm Tra Health Của Services

```bash
# Kiểm tra health của tất cả services
docker compose -f docker-compose.dev.yml ps

# Kiểm tra chi tiết service
docker inspect english-learning-api-dev
docker inspect english-learning-db-dev

# Xem resource usage
docker stats
docker stats english-learning-api-dev english-learning-db-dev

# Xem processes trong container
docker exec english-learning-api-dev ps aux
```

#### Restart Services

```bash
# Restart tất cả services
docker compose -f docker-compose.dev.yml restart

# Restart service cụ thể
docker compose -f docker-compose.dev.yml restart backend

# Restart với build
docker compose -f docker-compose.dev.yml up -d --build backend
```

#### Scaling Services

```bash
# Scale backend thành 3 instances
docker compose -f docker-compose.dev.yml up -d --scale backend=3

# Scale down
docker compose -f docker-compose.dev.yml up -d --scale backend=1
```

> **Lưu ý:** Cần load balancer để scale. Setup mặc định không bao gồm tính năng này.

#### Validate Configuration

```bash
# Validate compose file
docker compose -f docker-compose.dev.yml config

# Validate và hiển thị merged configuration
docker compose -f docker-compose.dev.yml config --quiet

# Liệt kê environment variables
docker compose -f docker-compose.dev.yml env
```

#### Cleanup và Maintenance

```bash
# Xóa images không sử dụng
docker image prune -f

# Xóa tất cả containers, networks, và images không sử dụng
docker system prune -f

# Xóa tất cả volumes (CẢNH BÁO: xóa tất cả data!)
docker system prune --volumes -f

# Xóa stopped containers và unused volumes
docker compose -f docker-compose.dev.yml down --remove-orphans

# Clean rebuild mọi thứ
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml up --build -d
```

#### Common Development Workflow

```bash
# Setup lần đầu
docker compose -f docker-compose.dev.yml up -d postgres redis minio
cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
docker compose -f docker-compose.dev.yml up --build -d backend

# Development hàng ngày
docker compose -f docker-compose.dev.yml up -d          # Khởi động services
docker compose -f docker-compose.dev.yml logs -f         # Xem logs
# ... thay đổi code (hot reload enabled) ...
docker compose -f docker-compose.dev.yml down            # Cuối ngày

# Sau khi pull code mới
docker compose -f docker-compose.dev.yml pull
docker compose -f docker-compose.dev.yml up --build -d

# Reset mọi thứ
docker compose -f docker-compose.dev.yml down -v
cd backend && npm run prisma:migrate && npm run prisma:seed
docker compose -f docker-compose.dev.yml up -d
```

#### Production Workflow

```bash
# Deploy
docker compose -f docker-compose.prod.yml up -d

# Xem logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Update (rebuild và restart)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up --build -d

# Rollback (restart với image hiện tại)
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# Full maintenance shutdown
docker compose -f docker-compose.prod.yml down
# ... thực hiện maintenance ...
docker compose -f docker-compose.prod.yml up -d
```

### Tạo Custom Docker Images

#### Backend Production Dockerfile

Backend Dockerfile (`backend/Dockerfile`) sử dụng multi-stage build:

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

Development Dockerfile (`backend/Dockerfile.dev`) hỗ trợ hot reload:

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

### Build Docker Images

Phần này hướng dẫn cách build Docker images độc lập (không qua docker-compose).

#### Build Backend Image

```bash
# Di chuyển vào thư mục backend
cd backend

# Build production image
docker build -t english-learning-backend:latest .

# Build với custom tag
docker build -t your-registry.com/english-learning-backend:v1.0.0 .

# Build với build arguments
docker build \
  --build-arg NODE_ENV=production \
  -t english-learning-backend:prod .

# Build cho platform cụ thể (Linux/amd64)
docker build --platform linux/amd64 -t english-learning-backend:latest .
```

#### Build Backend Image (Development với Hot Reload)

```bash
# Build development image
docker build -f Dockerfile.dev -t english-learning-backend:dev .

# Chạy với volume mount cho hot reload
docker run -d \
  --name english-backend-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/prisma:/app/prisma \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/english_learning \
  english-learning-backend:dev
```

> **Lưu ý:** Trên Windows, sử dụng `%cd%` thay vì `$(pwd)`.

#### Build Frontend Image

Tạo Dockerfile cho frontend tại `frontend/Dockerfile`:

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

Build frontend image:

```bash
cd frontend

# Build production image
docker build -t english-learning-frontend:latest .

# Chạy frontend container
docker run -d \
  --name english-frontend \
  -p 3681:3681 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 \
  english-learning-frontend:latest
```

#### Multi-Stage Build Để Giảm Kích Thước Image

```bash
# Build và hiển thị thời gian build
docker build -t english-learning-backend:latest --progress=plain . 2>&1 | tail -20

# Build không cache (dependencies mới)
docker build --no-cache -t english-learning-backend:latest .

# Build với cache (nhanh hơn)
docker build -t english-learning-backend:latest .
```

#### Build Arguments Reference

| Argument | Mặc định | Mô tả |
|----------|---------|-------|
| `NODE_ENV` | production | Build environment |
| `npm_config Production` | true | Bỏ qua dev dependencies |

---

### Push Images Lên Registry

#### Docker Hub

```bash
# Login vào Docker Hub
docker login

# Tag image
docker tag english-learning-backend:latest yourusername/english-learning-backend:latest

# Push lên Docker Hub
docker push yourusername/english-learning-backend:latest

# Push với version tag
docker tag english-learning-backend:latest yourusername/english-learning-backend:v1.0.0
docker push yourusername/english-learning-backend:v1.0.0
```

#### Amazon ECR

```bash
# Lấy ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag english-learning-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/english-learning-backend:latest

# Push lên ECR
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/english-learning-backend:latest
```

#### Google Container Registry (GCR)

```bash
# Login vào GCR
gcloud auth configure-docker

# Tag và push
docker tag english-learning-backend:latest gcr.io/your-project/english-learning-backend:latest
docker push gcr.io/your-project/english-learning-backend:latest
```

#### Private Registry

```bash
# Login vào private registry
docker login your-registry.com

# Tag và push
docker tag english-learning-backend:latest your-registry.com/english-learning-backend:latest
docker push your-registry.com/english-learning-backend:latest
```

---

### Multi-Architecture Build

Build images cho nhiều kiến trúc (amd64, arm64):

```bash
# Sử dụng buildx (cần Docker BuildKit)
docker buildx create --use
docker buildx inspect --bootstrap

# Build cho nhiều platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry.com/english-learning-backend:latest \
  --push \
  .

# Build và load vào local Docker (để test)
docker buildx build \
  --platform linux/amd64 \
  -t english-learning-backend:amd64 \
  --load \
  .
```

> **Yêu cầu:** Bật Docker BuildKit: `export DOCKER_BUILDKIT=1`

---

### Build Tất Cả Images (CI/CD)

Tạo script build cho CI/CD pipeline:

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

Cách sử dụng:

```bash
# Build và push lên registry
./build-images.sh your-registry.com v1.0.0

# Chỉ build (không push)
REGISTRY=local ./build-images.sh
```

---

### Tối Ưu Kích Thước Image

Giảm kích thước Docker image:

```bash
# Sử dụng multi-stage build (đã implement)
# Sử dụng alpine-based images (đã implement)
# Sử dụng .dockerignore file
```

Tạo `backend/.dockerignore`:

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

Tạo `frontend/.dockerignore`:

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

### Quản Lý Volumes

Docker volumes duy trì data giữa các lần restart container.

```bash
# Liệt kê volumes
docker volume ls | grep english

# Kiểm tra volume
docker volume inspect english-learning-platform_postgres_data

# Backup database
docker exec english-learning-db pg_dump -U postgres english_learning > backup.sql

# Restore database
docker exec -i english-learning-db psql -U postgres english_learning < backup.sql
```

---

## Biến Môi Trường

### Backend Variables

| Variable | Mặc định | Mô tả |
|----------|---------|-------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DATABASE_URL` | - | Chuỗi kết nối PostgreSQL |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | - | Redis password (tùy chọn) |
| `JWT_SECRET` | - | JWT signing secret (tối thiểu 32 ký tự) |
| `JWT_REFRESH_SECRET` | - | Refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token expiry |
| `FRONTEND_URL` | - | Frontend URL cho CORS |
| `S3_ENDPOINT` | - | MinIO/S3 endpoint |
| `S3_ACCESS_KEY` | - | Storage access key |
| `S3_SECRET_KEY` | - | Storage secret key |
| `S3_BUCKET` | english-learning | Storage bucket name |
| `S3_REGION` | us-east-1 | Storage region |
| `S3_PUBLIC_URL` | - | Public URL cho files |
| `ENABLE_HTTPS` | false | Bật chế độ HTTPS |
| `TRUST_PROXY` | false | Trust proxy headers |
| `ENABLE_SWAGGER` | true | Bật Swagger docs |
| `SECURE_COOKIE` | false | Secure cookie flag |

### Frontend Variables

| Variable | Mô tả |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `NEXT_PUBLIC_NODE_ENV` | Environment (development/production) |
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Bật tính năng AI |

---

## Các Lệnh Thường Dùng

### Backend Commands

```bash
cd backend

# Development
npm run start:dev         # Khởi động với hot reload
npm run start:debug       # Khởi động với debugger
npm run start:prod        # Khởi động production build

# Database
npm run prisma:generate    # Tạo Prisma client
npm run prisma:migrate     # Tạo/apply migrations
npm run prisma:push       # Push schema (không migration)
npm run prisma:seed       # Seed database
npm run prisma:studio     # Trình chỉnh sửa database trực quan

# Code Quality
npm run lint              # Kiểm tra code
npm run format            # Format code
npm run typecheck         # Kiểm tra TypeScript

# Testing
npm test                  # Chạy tests
npm run test:watch        # Chế độ watch
npm run test:cov          # Báo cáo coverage
npm run test:e2e          # E2E tests
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev               # Khởi động dev server (port 3681)
npm run dev:prod          # Khởi động với production mode

# Production
npm run build             # Build cho production
npm start                 # Khởi động production server
npm run start:prod        # Khởi động production server

# Code Quality
npm run lint              # Kiểm tra code
npm run format            # Format code
npm run type-check        # Kiểm tra TypeScript

# Testing
npm test                  # Chạy tests (Vitest)
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
docker compose -f docker-compose.dev.yml down -v   # Xóa volumes
docker compose -f docker-compose.prod.yml down -v

# Liệt kê containers
docker compose -f docker-compose.dev.yml ps

# Shell vào container
docker exec -it english-learning-api-dev sh
```

---

## Xử Lý Lỗi Thường Gặp

### Lỗi Kết Nối Database

**Lỗi:** `Connection refused` hoặc `ECONNREFUSED`

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   docker compose -f docker-compose.dev.yml ps postgres
   ```

2. Xác minh DATABASE_URL trong `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/english_learning
   ```

3. Kiểm tra port 5432 đang được sử dụng:
   ```bash
   netstat -an | findstr :5432  # Windows
   lsof -i :5432                  # Mac/Linux
   ```

### Prisma Client Chưa Được Tạo

```bash
cd backend
npm run prisma:generate
```

### Migration Thất Bại

**Lỗi:** `Migration not found` hoặc `Already at target migration`

**Giải pháp:**
1. Kiểm tra migration history:
   ```bash
   npx prisma migrate status
   ```

2. Cho development, reset migrations:
   ```bash
   npx prisma migrate reset --force
   npm run prisma:migrate
   npm run prisma:seed
   ```

### Port Đang Được Sử Dụng

```bash
# Tìm process đang sử dụng port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process hoặc đổi port trong .env
```

### Docker Container Issues

```bash
# Xem container logs
docker compose -f docker-compose.dev.yml logs backend

# Restart container
docker compose -f docker-compose.dev.yml restart backend

# Rebuild từ đầu
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### MinIO Access Issues

1. Truy cập MinIO Console tại http://localhost:9001
2. Credentials mặc định: minioadmin/minioadmin
3. Tạo bucket: `english-learning`
4. Đặt bucket policy cho public access

### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it english-learning-redis-dev redis-cli ping
# Nên trả về: PONG
```

### Clean Development Setup

Nếu bắt đầu lại từ đầu:

```bash
# 1. Dừng và xóa tất cả
docker compose -f docker-compose.dev.yml down -v

# 2. Xóa node_modules
rm -rf backend/node_modules frontend/node_modules

# 3. Xóa Prisma cache
rm -rf backend/node_modules/.prisma

# 4. Cài đặt lại
cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed

# 5. Khởi động lại
docker compose -f docker-compose.dev.yml up -d
```

---

## Tài Khoản Mặc Định

Sau khi seed, các tài khoản sau sẽ có sẵn:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |

**Lưu ý:** Thay đổi mật khẩu admin ngay trong production!

---

## Tài Liệu API

Sau khi backend khởi động, truy cập:
- **Swagger UI:** http://localhost:3000/api/docs
- **ReDoc:** http://localhost:3000/api/docs (alternative)

### Các Endpoint Xác Thực

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/v1/auth/register | Đăng ký người dùng mới |
| POST | /api/v1/auth/login | Đăng nhập |
| POST | /api/v1/auth/logout | Đăng xuất |
| POST | /api/v1/auth/refresh | Refresh tokens |
| POST | /api/v1/auth/forgot-password | Yêu cầu đặt lại mật khẩu |
| POST | /api/v1/auth/reset-password | Đặt lại mật khẩu |
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
