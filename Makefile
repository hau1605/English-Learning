# ============================================
# English Learning Platform - Makefile
# ============================================
# Provides convenient shortcuts for common commands

.PHONY: help install dev prod docker-up docker-down docker-clean db-reset logs backend-logs frontend-logs

# Help
help: @echo "English Learning Platform - Available Commands"
	@echo ""
	@echo "=== Installation ==="
	@echo "make install          - Install all dependencies (backend + frontend)"
	@echo ""
	@echo "=== Development ==="
	@echo "make dev             - Start development environment (all services)"
	@echo "make dev:backend     - Start backend only with hot reload"
	@echo "make dev:frontend    - Start frontend only"
	@echo "make dev:docker      - Start all services via Docker (dev mode)"
	@echo ""
	@echo "=== Production ==="
	@echo "make prod            - Start production build locally"
	@echo "make prod:docker     - Start all services via Docker (prod mode)"
	@echo ""
	@echo "=== Docker ==="
	@echo "make docker-up       - Start Docker services (dev)"
	@echo "make docker-up:prod  - Start Docker services (prod)"
	@echo "make docker-down     - Stop Docker services (dev)"
	@echo "make docker-down:prod - Stop Docker services (prod)"
	@echo "make docker-clean    - Remove all Docker volumes and containers"
	@echo "make docker-logs     - View Docker logs"
	@echo ""
	@echo "=== Database ==="
	@echo "make db-migrate      - Run database migrations"
	@echo "make db-push         - Push schema to database"
	@echo "make db-reset        - Reset database (dangerous!)"
	@echo "make db-studio       - Open Prisma Studio"
	@echo ""
	@echo "=== Logs ==="
	@echo "make logs:backend    - View backend logs"
	@echo "make logs:frontend   - View frontend logs"
	@echo "make logs:docker     - View Docker logs"
	@echo ""
	@echo "=== Testing ==="
	@echo "make test            - Run all tests"
	@echo "make test:watch      - Run tests in watch mode"
	@echo "make test:cov        - Run tests with coverage"
	@echo ""
	@echo "=== Utilities ==="
	@echo "make lint            - Run linter"
	@echo "make format          - Format code"
	@echo "make build           - Build both backend and frontend"
	@echo ""

# Installation
install:
	@echo "Installing dependencies..."
	@cd backend && npm install
	@cd frontend && npm install
	@echo "Done! Run 'make dev' to start."

install:backend
	@echo "Installing backend dependencies..."
	@cd backend && npm install

install:frontend
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

# Development
dev:
	@echo "Starting development environment..."
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:3681"
	@echo "MinIO Console: http://localhost:9001"
	@concurrently "npm run start:dev" "cd ../frontend && npm run dev"

dev:backend:
	@echo "Starting backend with hot reload..."
	@cd backend && npm run start:dev

dev:frontend:
	@echo "Starting frontend..."
	@cd frontend && npm run dev

dev:docker:
	@echo "Starting development environment via Docker..."
	@docker-compose -f docker-compose.dev.yml up --build

# Production
prod:
	@echo "Starting production build locally..."
	@concurrently "npm run start:prod" "cd ../frontend && npm run start"

prod:docker:
	@echo "Starting production environment via Docker..."
	@docker-compose -f docker-compose.prod.yml up --build -d

# Docker
docker-up:
	@docker-compose -f docker-compose.dev.yml up --build

docker-up:prod:
	@docker-compose -f docker-compose.prod.yml up --build -d

docker-down:
	@docker-compose -f docker-compose.dev.yml down

docker-down:prod:
	@docker-compose -f docker-compose.prod.yml down

docker-clean:
	@echo "Warning: This will remove all data!"
	@docker-compose -f docker-compose.dev.yml down -v
	@docker-compose -f docker-compose.prod.yml down -v

docker-logs:
	@docker-compose -f docker-compose.dev.yml logs -f

docker-logs:prod:
	@docker-compose -f docker-compose.prod.yml logs -f

# Database
db-migrate:
	@cd backend && npm run prisma:migrate

db-push:
	@cd backend && npm run prisma:push

db-reset:
	@echo "Warning: This will reset your database!"
	@cd backend && npm run prisma:migrate:reset

db-studio:
	@cd backend && npm run prisma:studio

# Logs
logs:backend:
	@echo "Following backend logs (Ctrl+C to exit)..."
	@docker logs -f english-learning-api-dev

logs:frontend:
	@echo "Following frontend logs..."
	@docker logs -f english-learning-frontend-dev

logs:docker:
	@docker-compose -f docker-compose.dev.yml logs -f

# Testing
test:
	@cd backend && npm run test

test:watch:
	@cd backend && npm run test:watch

test:cov:
	@cd backend && npm run test:cov

test:e2e:
	@cd backend && npm run test:e2e

# Linting & Formatting
lint:
	@cd backend && npm run lint
	@cd frontend && npm run lint

format:
	@cd backend && npm run format
	@cd frontend && npm run format

# Build
build:
	@echo "Building backend..."
	@cd backend && npm run build
	@echo "Building frontend..."
	@cd frontend && npm run build
	@echo "Build complete!"

build:backend:
	@cd backend && npm run build

build:frontend:
	@cd frontend && npm run build

# Prisma
prisma:generate:
	@cd backend && npm run prisma:generate

prisma:seed:
	@cd backend && npm run prisma:seed

# SSL Setup (for production)
ssl-setup:
	@echo "SSL Setup Instructions:"
	@echo "1. For Let's Encrypt, run:"
	@echo "   certbot certonly --standalone -d your-domain.com"
	@echo ""
	@echo "2. Copy certificates to nginx/ssl/"
	@echo "3. Update .env.production with correct paths"
	@echo ""
	@echo "Alternatively, for Docker production:"
	@echo "1. Create directory: mkdir -p certbot/conf certbot/www"
	@echo "2. Run certbot to generate certificates"
	@echo "3. docker-compose -f docker-compose.prod.yml up --build"

# Security check
security:env-check
	@echo "Checking for security issues..."
	@if grep -r "CHANGE_THIS" backend/.env.production 2>/dev/null; then \
		echo "WARNING: Found placeholder values in production .env!"; \
	else \
		echo "No placeholder values found in production .env"; \
	fi

env-check:
	@echo "Checking environment configuration..."
	@if [ ! -f backend/.env.production ]; then \
		echo "WARNING: backend/.env.production not found!"; \
	fi
	@if [ ! -f frontend/.env.production ]; then \
		echo "WARNING: frontend/.env.production not found!"; \
	fi
	@echo "Environment check complete."

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	@cd backend && rm -rf dist
	@cd frontend && rm -rf .next
	@echo "Done!"

# Default target
.DEFAULT_GOAL := help
