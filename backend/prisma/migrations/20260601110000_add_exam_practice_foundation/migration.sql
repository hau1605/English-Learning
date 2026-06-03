-- Exam practice foundation for TOEIC Reading MVP and future IELTS/VSTEP expansion.

CREATE TYPE "ExamSkill" AS ENUM ('LISTENING', 'READING', 'WRITING', 'SPEAKING');
CREATE TYPE "ExamQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_BLANK', 'TRUE_FALSE_NOT_GIVEN', 'YES_NO_NOT_GIVEN', 'MATCHING', 'ORDERING', 'ESSAY', 'SPEAKING_RESPONSE');
CREATE TYPE "ExamDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');
CREATE TYPE "ExamContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ExamPracticeSetType" AS ENUM ('PRACTICE_SET', 'MINI_TEST', 'FULL_TEST');
CREATE TYPE "ExamPracticeAttemptMode" AS ENUM ('PRACTICE', 'TEST', 'REVIEW_WRONG', 'REVIEW_SAVED');
CREATE TYPE "ExamPracticeAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');
CREATE TYPE "ExamReportReason" AS ENUM ('WRONG_ANSWER', 'UNCLEAR_EXPLANATION', 'AUDIO_ERROR', 'PASSAGE_ERROR', 'TRANSLATION_ERROR', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER');
CREATE TYPE "ExamReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED');

CREATE TABLE "exams" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "totalDurationMinutes" INTEGER,
  "scoringConfig" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_sections" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "skill" "ExamSkill" NOT NULL,
  "partNumber" INTEGER,
  "description" TEXT,
  "durationMinutes" INTEGER,
  "questionCount" INTEGER,
  "questionTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_passages" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "sectionId" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "passageType" TEXT,
  "topic" TEXT,
  "difficulty" "ExamDifficulty" NOT NULL DEFAULT 'MEDIUM',
  "source" TEXT,
  "status" "ExamContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "exam_passages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_questions" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "passageId" TEXT,
  "type" "ExamQuestionType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "explanation" TEXT,
  "difficulty" "ExamDifficulty" NOT NULL DEFAULT 'MEDIUM',
  "cefrLevel" TEXT,
  "topic" TEXT,
  "skillTag" TEXT,
  "knowledgeTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" TEXT,
  "status" "ExamContentStatus" NOT NULL DEFAULT 'DRAFT',
  "audioUrl" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_question_options" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT,
  CONSTRAINT "exam_question_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_practice_sets" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "sectionId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "ExamPracticeSetType" NOT NULL DEFAULT 'PRACTICE_SET',
  "recommendedMinutes" INTEGER,
  "difficulty" "ExamDifficulty" NOT NULL DEFAULT 'MEDIUM',
  "topic" TEXT,
  "showExplanationImmediately" BOOLEAN NOT NULL DEFAULT false,
  "allowRetake" BOOLEAN NOT NULL DEFAULT true,
  "status" "ExamContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "exam_practice_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_practice_set_questions" (
  "id" TEXT NOT NULL,
  "practiceSetId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "exam_practice_set_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_practice_attempts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "practiceSetId" TEXT NOT NULL,
  "mode" "ExamPracticeAttemptMode" NOT NULL DEFAULT 'PRACTICE',
  "status" "ExamPracticeAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "scorePercent" DOUBLE PRECISION,
  "totalCorrect" INTEGER NOT NULL DEFAULT 0,
  "totalQuestions" INTEGER NOT NULL DEFAULT 0,
  "timeSpentSeconds" INTEGER,
  "analysis" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_practice_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_practice_answers" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "textAnswer" TEXT,
  "isCorrect" BOOLEAN,
  "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "markedForReview" BOOLEAN NOT NULL DEFAULT false,
  "answeredAt" TIMESTAMP(3),
  "questionSnapshot" JSONB NOT NULL,
  "optionSnapshot" JSONB NOT NULL,
  "correctAnswerSnapshot" JSONB NOT NULL,
  "explanationSnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_practice_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_question_reports" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "reason" "ExamReportReason" NOT NULL,
  "message" TEXT,
  "status" "ExamReportStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_question_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exams_code_key" ON "exams"("code");
CREATE INDEX "exams_isActive_orderIndex_idx" ON "exams"("isActive", "orderIndex");
CREATE UNIQUE INDEX "exam_sections_examId_code_key" ON "exam_sections"("examId", "code");
CREATE INDEX "exam_sections_examId_orderIndex_idx" ON "exam_sections"("examId", "orderIndex");
CREATE INDEX "exam_passages_examId_status_idx" ON "exam_passages"("examId", "status");
CREATE INDEX "exam_passages_sectionId_idx" ON "exam_passages"("sectionId");
CREATE UNIQUE INDEX "exam_questions_code_key" ON "exam_questions"("code");
CREATE INDEX "exam_questions_examId_status_idx" ON "exam_questions"("examId", "status");
CREATE INDEX "exam_questions_sectionId_status_idx" ON "exam_questions"("sectionId", "status");
CREATE INDEX "exam_questions_passageId_idx" ON "exam_questions"("passageId");
CREATE INDEX "exam_questions_difficulty_idx" ON "exam_questions"("difficulty");
CREATE INDEX "exam_question_options_questionId_orderIndex_idx" ON "exam_question_options"("questionId", "orderIndex");
CREATE INDEX "exam_practice_sets_examId_status_idx" ON "exam_practice_sets"("examId", "status");
CREATE INDEX "exam_practice_sets_sectionId_status_idx" ON "exam_practice_sets"("sectionId", "status");
CREATE INDEX "exam_practice_sets_type_status_idx" ON "exam_practice_sets"("type", "status");
CREATE UNIQUE INDEX "exam_practice_set_questions_practiceSetId_questionId_key" ON "exam_practice_set_questions"("practiceSetId", "questionId");
CREATE INDEX "exam_practice_set_questions_practiceSetId_orderIndex_idx" ON "exam_practice_set_questions"("practiceSetId", "orderIndex");
CREATE INDEX "exam_practice_attempts_userId_startedAt_idx" ON "exam_practice_attempts"("userId", "startedAt");
CREATE INDEX "exam_practice_attempts_practiceSetId_status_idx" ON "exam_practice_attempts"("practiceSetId", "status");
CREATE UNIQUE INDEX "exam_practice_answers_attemptId_questionId_key" ON "exam_practice_answers"("attemptId", "questionId");
CREATE INDEX "exam_practice_answers_questionId_idx" ON "exam_practice_answers"("questionId");
CREATE INDEX "exam_question_reports_userId_createdAt_idx" ON "exam_question_reports"("userId", "createdAt");
CREATE INDEX "exam_question_reports_questionId_status_idx" ON "exam_question_reports"("questionId", "status");

ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_passages" ADD CONSTRAINT "exam_passages_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_passages" ADD CONSTRAINT "exam_passages_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "exam_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "exam_passages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exam_question_options" ADD CONSTRAINT "exam_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_sets" ADD CONSTRAINT "exam_practice_sets_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_sets" ADD CONSTRAINT "exam_practice_sets_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "exam_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exam_practice_set_questions" ADD CONSTRAINT "exam_practice_set_questions_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "exam_practice_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_set_questions" ADD CONSTRAINT "exam_practice_set_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_attempts" ADD CONSTRAINT "exam_practice_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_attempts" ADD CONSTRAINT "exam_practice_attempts_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "exam_practice_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_answers" ADD CONSTRAINT "exam_practice_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_practice_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_practice_answers" ADD CONSTRAINT "exam_practice_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_question_reports" ADD CONSTRAINT "exam_question_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_question_reports" ADD CONSTRAINT "exam_question_reports_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
