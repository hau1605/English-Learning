# Database Migrations - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết chiến lược database migrations, bao gồm best practices, rollback strategies, và deployment procedures.

---

# 1. Migration Strategy Overview

# 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| Backward Compatible | Migrations must not break existing code |
| Incremental | Small, focused migrations |
| Reversible | Support rollback when possible |
| Tested | Test migrations before production |
| Documented | Document schema changes |

---

# 1.2 Migration Types

```txt
┌─────────────────────────────────────────────────────────────┐
│                    Migration Types                            │
├──────────────────┬──────────────────┬─────────────────────┤
│   Add Column      │   Rename Column   │   Add Index         │
│   (Safe)         │   (Complex)       │   (Safe)            │
├──────────────────┼──────────────────┼─────────────────────┤
│   Add Table      │   Split Column    │   Add Constraint    │
│   (Safe)         │   (Complex)       │   (Safe)            │
├──────────────────┼──────────────────┼─────────────────────┤
│   Add Enum       │   Drop Column     │   Rename Table      │
│   (Safe)         │   (Multi-step)    │   (Multi-step)      │
└──────────────────┴──────────────────┴─────────────────────┘
```

---

# 2. Prisma Migrations

# 2.1 Basic Commands

```bash
# Create new migration
npx prisma migrate dev --name add_user_preferences

# Apply migrations to database
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Resolve migration conflicts
npx prisma migrate resolve --applied 20240101000000
npx prisma migrate resolve --rolled-back 20240101000000
```

---

# 2.2 Migration File Structure

```txt
prisma/
├── migrations/
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   ├── 20240102000000_add_users/
│   │   └── migration.sql
│   └── 20240103000000_add_flashcards/
│       └── migration.sql
├── schema.prisma
└── seed.ts
```

---

# 2.3 Migration File Example

```sql
-- Migration: Add user preferences table
-- Created: 2024-01-01

-- Add preferences table
CREATE TABLE "user_preferences" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "theme" VARCHAR(50) DEFAULT 'light',
    "language" VARCHAR(10) DEFAULT 'en',
    "notifications_enabled" BOOLEAN DEFAULT true,
    "daily_goal" INTEGER DEFAULT 10,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences"("user_id");

-- Add unique constraint
CREATE UNIQUE INDEX "idx_user_preferences_unique" ON "user_preferences"("user_id");
```

---

# 3. Safe Migration Patterns

# 3.1 Add Column (Safe)

# Step 1: Add nullable column

```sql
-- Add column as nullable (no default or explicit default)
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20);

-- OR with default (nullable)
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20) DEFAULT NULL;
```

# Step 2: Deploy code that uses new column

# Step 3: Add NOT NULL constraint

```sql
-- After code is deployed and data is populated
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
```

---

# 3.2 Add Column with Data

# Scenario: Add required field with default value

```sql
-- Step 1: Add nullable column
ALTER TABLE "users" ADD COLUMN "status" VARCHAR(20) DEFAULT 'pending';

-- Step 2: Backfill existing data
UPDATE "users" SET "status" = 'active' WHERE "status" IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;
```

---

# 3.3 Rename Column (Safe)

# Recommended: Add new column, migrate, remove old

```sql
-- Step 1: Add new column
ALTER TABLE "users" ADD COLUMN "full_name" VARCHAR(255);

-- Step 2: Copy data
UPDATE "users" SET "full_name" = "fullName";

-- Step 3: Deploy code using both columns
-- (Gradually migrate to use new column)

-- Step 4: After code deployment, drop old column
ALTER TABLE "users" DROP COLUMN "fullName";
```

---

# 3.4 Rename Table (Safe)

```sql
-- Step 1: Create new table
CREATE TABLE "user_profiles" (LIKE "user_profile" INCLUDING ALL);

-- Step 2: Copy data
INSERT INTO "user_profiles" SELECT * FROM "user_profile";

-- Step 3: Deploy code using new table name

-- Step 4: Drop old table
DROP TABLE "user_profile";
```

---

# 3.5 Add Index (Safe)

```sql
-- Add index (PostgreSQL locks table briefly for ACCESS EXCLUSIVE)
-- For large tables, use CONCURRENTLY
CREATE INDEX CONCURRENTLY "idx_users_email" ON "users"("email");

-- Composite index
CREATE INDEX CONCURRENTLY "idx_flashcard_due" ON "user_flashcard_reviews"("user_id", "next_review_at");
```

---

# 3.6 Remove Column (Safe)

```sql
-- Step 1: Remove all code references to column

-- Step 2: Deploy code

-- Step 3: Drop column in separate migration
ALTER TABLE "users" DROP COLUMN "legacy_field";
```

---

# 3.7 Add Enum (Safe)

```sql
-- Add enum type
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended');

-- Add column with enum
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active';

-- Add NOT NULL after data is migrated
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;
```

---

# 3.8 Modify Column Type (Safe)

```sql
-- Expand type (e.g., VARCHAR(50) -> VARCHAR(100))
ALTER TABLE "users" ALTER COLUMN "phone" TYPE VARCHAR(20);

-- Change type with cast
ALTER TABLE "users" ALTER COLUMN "count" TYPE INTEGER USING count::INTEGER;
```

---

# 4. Risky Migrations

# 4.1 Operations to Avoid

| Operation | Risk | Alternative |
|-----------|------|-------------|
| DROP TABLE | Data loss | Soft delete, then drop |
| DROP COLUMN | Data loss | Remove references first |
| RENAME without plan | Broken code | Add new, migrate, drop old |
| NOT NULL without default | Failed insert | Add nullable first |
| Locking index on large table | Downtime | Use CONCURRENTLY |

---

# 4.2 Large Table Operations

# Lock-free index creation

```sql
-- Good: Non-blocking
CREATE INDEX CONCURRENTLY "idx_large_table" ON "big_table"("column");

-- Bad: Locks table
CREATE INDEX "idx_large_table" ON "big_table"("column");
```

# Large table column add

```sql
-- For very large tables, use pg_repack or partial approach
-- Option 1: Add with default, then backfill
ALTER TABLE "users" ADD COLUMN "new_field" INTEGER DEFAULT 0;

-- Option 2: Use pg_repack for zero-downtime
pg_repack -t users --add-column new_field
```

---

# 5. Migration Workflow

# 5.1 Development Flow

```txt
┌─────────────────────────────────────────────────────────────┐
│                      Development                             │
│                                                              │
│  1. Update schema.prisma                                     │
│  2. npx prisma migrate dev --name description                │
│  3. Test locally                                             │
│  4. Review generated SQL                                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Code Review                             │
│                                                              │
│  1. Review migration SQL                                     │
│  2. Ensure backward compatibility                            │
│  3. Plan rollback strategy                                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Staging Deploy                          │
│                                                              │
│  1. Apply migration                                          │
│  2. Deploy code                                             │
│  3. Monitor                                                 │
│  4. Test thoroughly                                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Production Deploy                        │
│                                                              │
│  1. Apply migration                                          │
│  2. Deploy code                                             │
│  3. Monitor                                                 │
│  4. Verify                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

# 5.2 Two-Phase Migration

# Phase 1: Add new structure

```sql
-- Migration 1
ALTER TABLE "users" ADD COLUMN "new_field" VARCHAR(255);
```

# Deploy code that handles both old and new

```typescript
// Code supports both
const field = user.newField || user.oldField;
```

# Phase 2: Remove old structure

```sql
-- Migration 2
ALTER TABLE "users" DROP COLUMN "oldField";
```

---

# 6. Rollback Strategy

# 6.1 Reversible Migrations

```sql
-- Reversible: Add column
-- Forward
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20);
-- Rollback
ALTER TABLE "users" DROP COLUMN "phone";

-- Reversible: Add index
-- Forward
CREATE INDEX CONCURRENTLY "idx_users_email" ON "users"("email");
-- Rollback
DROP INDEX "idx_users_email";
```

---

# 6.2 Non-reversible Migrations

```sql
-- Not easily reversible: Drop column
-- Make it reversible with backup table

-- Step 1: Before drop, create backup
CREATE TABLE "users_backup_20240101" AS SELECT * FROM "users";

-- Step 2: Drop column
ALTER TABLE "users" DROP COLUMN "legacy_field";

-- Rollback: Recreate from backup
INSERT INTO "users" SELECT * FROM "users_backup_20240101";
ALTER TABLE "users" ADD COLUMN "legacy_field" TYPE;
```

---

# 6.3 Rollback Procedure

```typescript
// rollback/migration-001.ts
export async function rollback001(prisma: PrismaService) {
  // Drop what migration 001 created
  await prisma.$executeRaw`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";
  `;

  // Or recreate what was dropped
  await prisma.$executeRaw`
    CREATE TABLE "deleted_table_backup" AS SELECT * FROM "deleted_table";
  `;
}
```

---

# 7. Data Migration

# 7.1 Data Backfill

```typescript
// prisma/seed.ts
async function backfillData() {
  // Backfill user statistics
  const users = await prisma.user.findMany();

  for (const user of users) {
    const stats = await calculateUserStats(user.id);
    await prisma.userStats.upsert({
      where: { userId: user.id },
      update: stats,
      create: { userId: user.id, ...stats },
    });
  }
}
```

---

# 7.2 Large Data Migration

```typescript
// For large datasets, batch processing
async function migrateLargeTable() {
  const batchSize = 1000;
  let cursor: string | undefined;

  while (true) {
    const records = await prisma.record.findMany({
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (records.length === 0) break;

    for (const record of records) {
      await processRecord(record);
    }

    cursor = records[records.length - 1].id;
    console.log(`Processed ${cursor}`);
  }
}
```

---

# 7.3 Zero-downtime Migration

```sql
-- Migration: Add NOT NULL to large table

-- Step 1: Create trigger to auto-fill new column
CREATE OR REPLACE FUNCTION auto_fill_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.new_column := COALESCE(NEW.new_column, 'default_value');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_fill_trigger
BEFORE INSERT OR UPDATE ON large_table
FOR EACH ROW
EXECUTE FUNCTION auto_fill_column();

-- Step 2: Backfill existing data
UPDATE large_table SET new_column = 'default_value' WHERE new_column IS NULL;

-- Step 3: Add constraint
ALTER TABLE large_table ALTER COLUMN new_column SET NOT NULL;

-- Step 4: Remove trigger
DROP TRIGGER auto_fill_trigger ON large_table;
```

---

# 8. Schema Best Practices

# 8.1 Naming Convention

```sql
-- Tables: snake_case, plural
CREATE TABLE "user_profiles";
CREATE TABLE "flashcard_reviews";

-- Columns: snake_case
CREATE TABLE "users" (
    "full_name" VARCHAR(255),
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP
);

-- Indexes: idx_{table}_{column(s)}
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_user_flashcard_reviews_user_due" ON "user_flashcard_reviews"("user_id", "next_review_at");
```

---

# 8.2 Required Fields

```sql
CREATE TABLE "example" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);
```

---

# 8.3 Soft Deletes

```sql
-- Add deleted_at for soft delete
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP;

-- Query active records
SELECT * FROM "users" WHERE "deleted_at" IS NULL;

-- Query all records (including deleted)
SELECT * FROM "users";

-- Soft delete
UPDATE "users" SET "deleted_at" = NOW() WHERE id = '123';

-- Hard delete (in cron job)
DELETE FROM "users" WHERE "deleted_at" < NOW() - INTERVAL '30 days';
```

---

# 9. Testing Migrations

# 9.1 Test in Development

```bash
# Reset dev database
npx prisma migrate reset

# Apply specific migration
npx prisma migrate resolve --applied 20240101000000

# Check status
npx prisma migrate status
```

---

# 9.2 Test Migration SQL

```sql
-- Preview migration (dry run)
-- In PostgreSQL, you can test with:
BEGIN;
-- Your migration SQL here
ROLLBACK;
```

---

# 9.3 Integration Tests

```typescript
describe('Database Migration', () => {
  beforeAll(async () => {
    // Apply migrations to test database
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "test_table" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255)
    )`;
  });

  afterAll(async () => {
    // Cleanup test tables
    await prisma.$executeRaw`DROP TABLE IF EXISTS "test_table"`;
  });

  it('should handle migration correctly', async () => {
    // Test code that uses new schema
  });
});
```

---

# 10. Migration Checklist

# Pre-Migration

- [ ] Review migration SQL
- [ ] Check for data type changes
- [ ] Plan rollback strategy
- [ ] Test in development
- [ ] Backup database
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team

# During Migration

- [ ] Monitor execution time
- [ ] Watch for errors
- [ ] Check database locks
- [ ] Verify row counts

# Post-Migration

- [ ] Verify data integrity
- [ ] Run application tests
- [ ] Monitor performance
- [ ] Check logs for errors
- [ ] Update documentation
- [ ] Announce completion

---

# 11. Emergency Procedures

# 11.1 Migration Failed

```sql
-- Check current state
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;

-- Rollback failed migration
npx prisma migrate resolve --rolled-back 20240101000000

-- Re-run migration
npx prisma migrate resolve --applied 20240101000000
```

---

# 11.2 Data Corruption

```sql
-- Restore from backup
pg_restore -h localhost -U user -d database backup.sql

-- Point-in-time recovery
pg_restore -h localhost -U user -d database --point-in-time="2024-01-01 10:00:00" backup.tar
```

---

# 12. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
