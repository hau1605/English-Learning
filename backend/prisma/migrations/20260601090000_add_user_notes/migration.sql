-- Add user-owned notes and saved learning items.

CREATE TYPE "NoteType" AS ENUM (
  'VOCABULARY',
  'GRAMMAR',
  'PHRASE',
  'LESSON',
  'QUIZ_MISTAKE',
  'SPEAKING_FEEDBACK',
  'CUSTOM'
);

CREATE TYPE "NoteSourceType" AS ENUM (
  'VOCABULARY',
  'GRAMMAR_LESSON',
  'LESSON',
  'QUIZ',
  'QUIZ_QUESTION',
  'SPEAKING_ATTEMPT'
);

CREATE TABLE "user_notes" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NoteType" NOT NULL DEFAULT 'CUSTOM',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceType" "NoteSourceType",
  "sourceId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "color" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "reviewAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_notes_userId_createdAt_idx" ON "user_notes"("userId", "createdAt");
CREATE INDEX "user_notes_userId_type_idx" ON "user_notes"("userId", "type");
CREATE INDEX "user_notes_userId_isArchived_idx" ON "user_notes"("userId", "isArchived");
CREATE INDEX "user_notes_userId_sourceType_sourceId_idx" ON "user_notes"("userId", "sourceType", "sourceId");

ALTER TABLE "user_notes"
  ADD CONSTRAINT "user_notes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
