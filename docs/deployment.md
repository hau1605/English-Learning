# Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Production Requirements](#production-requirements)
- [Environment Configuration](#environment-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

This guide covers deploying the English Learning Platform to production using Docker Compose. The production setup includes:

- PostgreSQL 15 for data persistence
- Redis 7 for caching and session storage
- MinIO for object storage
- NestJS backend API
- Next.js frontend
- Nginx reverse proxy with HTTPS

## Production Requirements

### System Requirements

- **OS:** Linux (Ubuntu 20.04+ recommended)
- **CPU:** 2+ cores
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 20GB+ available space
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

### Domain Requirements

- A registered domain name
- DNS A record pointing to your server IP
- SSL certificates (Let's Encrypt recommended)

## Environment Configuration

### 1. Create Production Environment Files

#### Backend: `backend/.env.production`

```env
# Application
PORT=3000
NODE_ENV=production

# Database - Use internal Docker network hostname
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/english_learning

# Redis - Use internal Docker network hostname
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT - MUST BE STRONG SECRETS (min 32 characters)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL - Your production domain
FRONTEND_URL=https://your-domain.com

# OpenAI (if using AI features)
OPENAI_API_KEY=${OPENAI_API_KEY}

# Storage (MinIO)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=${MINIO_ROOT_USER}
S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
S3_BUCKET=${S3_BUCKET:-english-learning}
S3_REGION=${S3_REGION:-us-east-1}
S3_PUBLIC_URL=https://your-media-domain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info

# Security - PRODUCTION SETTINGS
ENABLE_HTTPS=true
TRUST_PROXY=true
ENABLE_SWAGGER=false
SECURE_COOKIE=true

# SSL Certificates
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

#### Frontend: `frontend/.env.production`

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_NODE_ENV=production
```

### 2. Create Secrets File

Create a `.env.production.secrets` file (DO NOT commit this to git):

```bash
# Generate strong secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET

# Or use a password generator
# PostgreSQL
POSTGRES_PASSWORD=your-strong-postgres-password

# Redis
REDIS_PASSWORD=your-strong-redis-password

# JWT
JWT_SECRET=your-strong-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-strong-refresh-secret-min-32-chars

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-strong-minio-password

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Domain
FRONTEND_URL=https://your-domain.com
S3_PUBLIC_URL=https://your-media-domain.com
S3_BUCKET=english-learning
S3_REGION=us-east-1
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# 1. Create directories for certbot
mkdir -p certbot/conf certbot/www

# 2. Stop any running services
docker-compose -f docker-compose.prod.yml down

# 3. Start only nginx for ACME challenge
docker-compose -f docker-compose.prod.yml up -d nginx

# 4. Obtain certificates
docker-compose -f docker-compose.prod.yml run --rm \
  -e DOMAINS=your-domain.com \
  certbot certonly --webroot -w /var/www/certbot \
  --email your-email@example.com \
  --agree-tos --no-eff-email \
  -d your-domain.com

# 5. Copy certificates to nginx/ssl/
mkdir -p nginx/ssl
cp certbot/conf/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp certbot/conf/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 6. Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Commercial SSL Certificate

```bash
# 1. Obtain certificate from your provider
# 2. Create directory
mkdir -p nginx/ssl

# 3. Copy your certificates
cp your-certificate.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/key.pem

# 4. Set correct permissions
chmod 600 nginx/ssl/key.pem
```

### Option 3: Self-Signed (Testing Only)

```bash
# Generate self-signed certificate (NOT for production!)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -out nginx/ssl/cert.pem \
  -keyout nginx/ssl/key.pem \
  -subj "/CN=your-domain.com"
```

## Docker Deployment

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt install docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
exit
```

### 2. Deploy Application

```bash
# 1. Clone or update repository
git clone your-repo-url
cd english-learning-platform

# 2. Create production secrets file
cp .env.example .env.production
# Edit .env.production with your values

# 3. Set up SSL certificates (see above)

# 4. Create Docker network (for existing projects)
docker network create english-learning-prod 2>/dev/null || true

# 5. Start services
docker-compose -f docker-compose.prod.yml up --build -d

# 6. Check status
docker-compose -f docker-compose.prod.yml ps

# 7. View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Initialize Database

```bash
# Run migrations
docker exec english-learning-api npm run prisma:migrate deploy

# Or if using Prisma:
docker exec english-learning-api npx prisma migrate deploy

# Seed database (optional)
docker exec english-learning-api npm run prisma:seed
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test API health
curl https://your-domain.com/health

# Test HTTPS
curl -I https://your-domain.com

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## Manual Deployment

### Backend

```bash
# 1. Install dependencies
cd backend
npm install --only=production

# 2. Build
npm run build

# 3. Run database migrations
npm run prisma:generate
npm run prisma:migrate deploy

# 4. Start with environment variables
NODE_ENV=production PORT=3000 \
JWT_SECRET=your-secret \
DATABASE_URL=your-db-url \
npm run start:prod
```

### Frontend

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Build
NEXT_PUBLIC_NODE_ENV=production npm run build

# 3. Start server
NODE_ENV=production npm run start
```

### Nginx

```bash
# 1. Copy configuration
sudo cp nginx/nginx.prod.conf /etc/nginx/sites-available/english-learning
sudo ln -s /etc/nginx/sites-available/english-learning /etc/nginx/sites-enabled/

# 2. Test configuration
sudo nginx -t

# 3. Reload nginx
sudo systemctl reload nginx
```

## Post-Deployment

### 1. Create Admin User

```bash
docker exec -it english-learning-api npm run prisma:seed
```

### 2. Configure Backup

```bash
# PostgreSQL backup
docker exec english-learning-db pg_dump -U postgres english_learning > backup.sql

# Schedule regular backups (crontab)
0 2 * * * docker exec english-learning-db pg_dump -U postgres english_learning > /backups/english-learning-$(date +\%Y\%m\%d).sql
```

### 3. Set Up Monitoring

- Enable Docker health checks
- Set up log aggregation
- Configure alerts for service failures

## Monitoring & Logging

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Save logs to file
docker-compose -f docker-compose.prod.yml logs > deployment.log
```

### Health Checks

```bash
# Check service health
docker inspect english-learning-api --format='{{.State.Health.Status}}'
docker inspect english-learning-db --format='{{.State.Health.Status}}'
docker inspect english-learning-redis --format='{{.State.Health.Status}}'
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats english-learning-api
```

## Security Checklist

Before going live, verify:

- [ ] Strong JWT secrets (32+ characters)
- [ ] `NODE_ENV=production` set
- [ ] `ENABLE_SWAGGER=false` (disable Swagger in production)
- [ ] `SECURE_COOKIE=true`
- [ ] `TRUST_PROXY=true`
- [ ] SSL certificates installed and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CORS configured for production domain only
- [ ] Database password changed from default
- [ ] Redis password set
- [ ] MinIO credentials changed from default
- [ ] No `.env` files committed to git
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Regular backups scheduled

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check for port conflicts
netstat -tlnp | grep -E '80|443|3000|9000'

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Try connecting
docker exec -it english-learning-db psql -U postgres -d english_learning
```

### SSL Certificate Issues

```bash
# Check certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Renew Let's Encrypt
docker-compose -f docker-compose.prod.yml run --rm certbot renew
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View nginx access logs
docker exec english-learning-nginx tail -f /var/log/nginx/access.log

# Check backend response times
docker logs english-learning-api --since 10m | grep 'GET'
```

### SSL Renewal

```bash
# For Let's Encrypt
docker-compose -f docker-compose.prod.yml run --rm \
  -e DOMAINS=your-domain.com \
  certbot renew

# Reload nginx
docker exec english-learning-nginx nginx -s reload
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild services
docker-compose -f docker-compose.prod.yml up --build -d

# Run migrations if needed
docker exec english-learning-api npx prisma migrate deploy
```

### Backup & Restore

```bash
# Create backup
docker exec english-learning-db pg_dump -U postgres english_learning > backup-$(date +%Y%m%d).sql

# Restore from backup
cat backup.sql | docker exec -i english-learning-db psql -U postgres -d english_learning
```

### Stop Services

```bash
# Stop gracefully
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

## Quick Reference

```bash
# Start production
docker-compose -f docker-compose.prod.yml up --build -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Execute command in container
docker exec -it english-learning-api /bin/sh

# Update SSL certificates
# 1. Copy new certs to nginx/ssl/
# 2. Reload nginx
docker exec english-learning-nginx nginx -s reload
```
