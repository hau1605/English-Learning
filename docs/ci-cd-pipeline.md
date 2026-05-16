# CI/CD Pipeline - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết CI/CD pipeline cho deployment automation, bao gồm GitHub Actions workflows, deployment strategies, và rollback procedures.

---

# 1. CI/CD Overview

# 1.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Development                               │
│                                                              │
│  Feature Branch → Push → GitHub                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      CI Pipeline (PR)                           │
│                                                              │
│  ├── Lint                                                     │
│  ├── Type Check                                               │
│  ├── Test                                                     │
│  └── Build                                                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CD Pipeline (Main)                          │
│                                                              │
│  ├── Build Docker Image                                        │
│  ├── Security Scan                                             │
│  ├── Push to Registry                                         │
│  └── Deploy to Staging                                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                         │
│                                                              │
│  ├── Approval (Manual)                                        │
│  ├── Deploy to Production                                     │
│  └── Monitor                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2. GitHub Actions Workflows

# 2.1 CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
        run: npm run test

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

---

# 2.2 CD Workflow

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    name: Build & Push
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
        run: npm run test

      - name: Build
        run: npm run build

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_VERSION=${{ env.NODE_VERSION }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        uses: ./.github/actions/deploy
        with:
          environment: staging
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://app.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        uses: ./.github/actions/deploy
        with:
          environment: production
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

---

# 2.3 Frontend Workflow

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']

env:
  NODE_VERSION: '20'

jobs:
  test:
    name: Test Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Run type check
        run: npm run typecheck

  build:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: test
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/.next
          retention-days: 1

  deploy-staging:
    name: Deploy Frontend to Staging
    runs-on: ubuntu-latest
    needs: build
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/.next

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod=false'

  deploy-production:
    name: Deploy Frontend to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://example.com

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/.next

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'
```

---

# 3. Deployment Actions

# 3.1 Deploy Action

```yaml
# .github/actions/deploy/action.yml
name: Deploy
description: Deploy to environment

inputs:
  environment:
    description: 'Target environment'
    required: true
  image:
    description: 'Docker image to deploy'
    required: true

runs:
  using: composite
  steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
        aws-region: ${{ secrets.AWS_REGION }}

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster ${{ inputs.environment }}-cluster \
          --service ${{ inputs.environment }}-api \
          --force-new-deployment \
          --region ${{ secrets.AWS_REGION }}

    - name: Wait for deployment
      run: |
        aws ecs wait services-stable \
          --cluster ${{ inputs.environment }}-cluster \
          --services ${{ inputs.environment }}-api \
          --region ${{ secrets.AWS_REGION }}

    - name: Run database migrations
      run: |
        aws ecs run-task \
          --cluster ${{ inputs.environment }}-cluster \
          --task-definition ${{ inputs.environment }}-migrations \
          --launch-type FARGATE \
          --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.SUBNET_IDS }}],securityGroups=[${{ secrets.SG_ID }}]}"
```

---

# 4. Docker Configuration

# 4.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "dist/main"]
```

---

# 4.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: elp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

# 5. Environment Configuration

# 5.1 Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/elp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3001

# Third-party
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=elp-uploads
```

---

# 5.2 Secrets Management

```yaml
# GitHub Secrets
DATABASE_URL: postgresql://...
REDIS_URL: redis://...
JWT_ACCESS_SECRET: ...
JWT_REFRESH_SECRET: ...
AWS_ACCESS_KEY_ID: ...
AWS_SECRET_ACCESS_KEY: ...
AWS_REGION: us-east-1
AWS_ROLE_ARN: arn:aws:iam::...:role/GitHubActionsRole
VERCEL_TOKEN: ...
```

---

# 6. Deployment Strategies

# 6.1 Rolling Deployment

```yaml
# ECS rolling update
deploymentConfiguration:
  minimumHealthyPercent: 100
  maximumPercent: 200

# Wait for new tasks to be healthy before stopping old ones
healthCheckGracePeriodSeconds: 30
```

---

# 6.2 Blue-Green Deployment

```yaml
# For critical deployments
blue_green_deployment:
  strategy: "canary"
  canary_percentage: 10
  automatic_rollback:
    enabled: true
    threshold: 5  # Automatic rollback if error rate > 5%

# Manual promotion
promote:
  - Run smoke tests
  - Monitor for 15 minutes
  - Shift 50% traffic
  - Monitor for 30 minutes
  - Shift 100% traffic
```

---

# 6.3 Canary Deployment

```yaml
# Gradual traffic shifting
canary:
  steps:
    - weight: 10  # 10% to new version
    - pause: { duration: 10m }
    - weight: 30
    - pause: { duration: 10m }
    - weight: 50
    - pause: { duration: 10m }
    - weight: 100

  analysis:
    metrics:
      - type: error-rate
        threshold: 5
      - type: latency
        threshold: 1000
```

---

# 7. Database Migrations

# 7.1 Migration in Pipeline

```yaml
# In deploy action
- name: Run migrations
  run: |
    aws ecs run-task \
      --cluster production-cluster \
      --task-definition production-migrations \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.SUBNET_IDS }}],securityGroups=[${{ secrets.SG_ID }}]}"
    --overrides "containerOverrides=[{\"name\":\"migrations\",\"environment\":[{\"name\":\"DATABASE_URL\",\"value\":\"${{ secrets.DATABASE_URL }}\"}]}]"

- name: Wait for migrations
  run: |
    task_arn=$(aws ecs list-tasks --cluster production-cluster --family production-migrations --query 'taskArns[0]' --output text)
    aws ecs wait tasks-stopped --cluster production-cluster --tasks $task_arn
    aws ecs describe-tasks --cluster production-cluster --tasks $task_arn --query 'tasks[0].containers[0].exitCode'
```

---

# 8. Rollback Strategy

# 8.1 Automatic Rollback

```yaml
# CloudWatch alarm triggers rollback
rollback:
  automatic:
    enabled: true
    conditions:
      - error_rate > 5%
      - latency_p99 > 2000ms
      - healthy_tasks < 2

  procedure:
    - step: Stop deploying
    - step: Revert to previous task definition
    - step: Alert on-call
    - step: Create incident
```

---

# 8.2 Manual Rollback

```bash
# Rollback to previous image
aws ecs update-service \
  --cluster production-cluster \
  --service production-api \
  --task-definition production-api:previous

# Or rollback to specific version
aws ecs update-service \
  --cluster production-cluster \
  --service production-api \
  --task-definition production-api:123

# Wait for stability
aws ecs wait services-stable \
  --cluster production-cluster \
  --services production-api
```

---

# 8.3 Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./rollback.sh <environment> [version]"
  exit 1
fi

# Get current task definition
CURRENT_TASK=$(aws ecs describe-services \
  --cluster $ENVIRONMENT-cluster \
  --services $ENVIRONMENT-api \
  --query 'services[0].taskDefinition' \
  --output text)

if [ -n "$VERSION" ]; then
  # Rollback to specific version
  TASK_DEF="$ENVIRONMENT-api:$VERSION"
else
  # Rollback to previous version
  TASK_DEF="${CURRENT_TASK%:*}:$((${CURRENT_TASK##*:} - 1))"
fi

echo "Rolling back $ENVIRONMENT to $TASK_DEF"

aws ecs update-service \
  --cluster $ENVIRONMENT-cluster \
  --service $ENVIRONMENT-api \
  --task-definition $TASK_DEF \
  --force-new-deployment

aws ecs wait services-stable \
  --cluster $ENVIRONMENT-cluster \
  --services $ENVIRONMENT-api

echo "Rollback completed"
```

---

# 9. Monitoring Deployment

# 9.1 Health Check

```yaml
# After deployment
- name: Health check
  run: |
    for i in {1..30}; do
      response=$(curl -s -o /dev/null -w "%{http_code}" http://${{ secrets.API_URL }}/health)
      if [ "$response" = "200" ]; then
        echo "Health check passed"
        exit 0
      fi
      echo "Waiting for health check... ($i/30)"
      sleep 10
    done
    echo "Health check failed"
    exit 1
```

---

# 9.2 Smoke Tests

```yaml
# After deployment
- name: Run smoke tests
  run: |
    npm run test:smoke
  env:
    API_URL: ${{ secrets.API_URL }}

# smoke tests example
describe('Smoke Tests', () => {
  it('should return 200 from health endpoint', async () => {
    const response = await fetch(`${process.env.API_URL}/health`);
    expect(response.status).toBe(200);
  });

  it('should login successfully', async () => {
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
      }),
    });
    expect(response.status).toBe(200);
  });
});
```

---

# 10. Feature Flags Integration

# 10.1 Feature Flag Workflow

```yaml
# Enable feature flag after deployment
- name: Enable feature flag
  run: |
    curl -X POST https://api.unleash.example.com/api/admin/projects/default/features \
      -H "Authorization: Bearer ${{ secrets.UNLEASH_TOKEN }}" \
      -d '{"name": "new-feature", "enabled": true, "strategies": [{"name": "gradualRollout", "parameters": {"percentage": "10"}}]}"
```

---

# 11. Security Scanning

# 11.1 Dependency Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  dependency-check:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  container-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

# 12. Notification

# 12.1 Slack Notifications

```yaml
# In deploy job
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: ${{ secrets.SLACK_CHANNEL_ID }}
    payload: |
      {
        "text": "${{ job.status == 'success' && '✅' || '❌' }} Deployment ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*${{ env.ENVIRONMENT }} Deployment*\n${{ job.status == 'success' && ':white_check_mark: Success' || ':x: Failed' }}"
            }
          }
        ]
      }
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

# 13. Checklist

# CI Pipeline

- [x] Lint
- [x] Type check
- [x] Unit tests
- [x] Integration tests
- [x] Build
- [x] Artifact upload

# CD Pipeline

- [x] Docker build
- [x] Push to registry
- [x] Security scan
- [x] Deploy to staging
- [x] Database migrations
- [x] Health check
- [x] Smoke tests
- [x] Deploy to production
- [x] Approval gate

# Post-deployment

- [x] Monitoring
- [x] Rollback strategy
- [x] Notifications
- [ ] Runbooks
- [ ] Post-mortem template

---

# 14. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
