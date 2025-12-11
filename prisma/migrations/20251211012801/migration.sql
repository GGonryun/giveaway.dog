/*
  Warnings:

  - You are about to drop the column `sweepstakesId` on the `AgeVerification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TaskCompletion` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TaskProgress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[participantId]` on the table `AgeVerification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[participantId,taskId]` on the table `TaskProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participantId` to the `AgeVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantId` to the `TaskCompletion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantId` to the `TaskProgress` table without a default value. This is not possible if the table is not empty.

*/

-- =============================================================================
-- PHASE 1: Create Participant table and add nullable participantId columns
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_userId_sweepstakesId_key" ON "Participant"("userId", "sweepstakesId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add participantId columns as NULLABLE first
ALTER TABLE "TaskCompletion" ADD COLUMN "participantId" TEXT;
ALTER TABLE "TaskProgress" ADD COLUMN "participantId" TEXT;
ALTER TABLE "AgeVerification" ADD COLUMN "participantId" TEXT;

-- =============================================================================
-- PHASE 2: Populate Participant table and backfill participantId values
-- =============================================================================

-- Create Participant records for all unique (userId, sweepstakesId) combinations from TaskCompletion
INSERT INTO "Participant" ("id", "userId", "sweepstakesId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  tc."userId",
  t."sweepstakesId",
  MIN(tc."completedAt"),
  NOW()
FROM "TaskCompletion" tc
JOIN "Task" t ON tc."taskId" = t."id"
WHERE tc."userId" IS NOT NULL
GROUP BY tc."userId", t."sweepstakesId"
ON CONFLICT ("userId", "sweepstakesId") DO NOTHING;

-- Create Participant records for TaskProgress (if any don't already exist)
INSERT INTO "Participant" ("id", "userId", "sweepstakesId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  tp."userId",
  t."sweepstakesId",
  MIN(tp."updatedAt"),
  NOW()
FROM "TaskProgress" tp
JOIN "Task" t ON tp."taskId" = t."id"
WHERE tp."userId" IS NOT NULL
GROUP BY tp."userId", t."sweepstakesId"
ON CONFLICT ("userId", "sweepstakesId") DO NOTHING;

-- Create Participant records for AgeVerification (if any don't already exist)
INSERT INTO "Participant" ("id", "userId", "sweepstakesId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  av."userId",
  av."sweepstakesId",
  MIN(av."createdAt"),
  NOW()
FROM "AgeVerification" av
WHERE av."userId" IS NOT NULL AND av."sweepstakesId" IS NOT NULL
GROUP BY av."userId", av."sweepstakesId"
ON CONFLICT ("userId", "sweepstakesId") DO NOTHING;

-- Update TaskCompletion with participantId
UPDATE "TaskCompletion" tc
SET "participantId" = p."id"
FROM "Task" t, "Participant" p
WHERE tc."taskId" = t."id"
  AND p."userId" = tc."userId"
  AND p."sweepstakesId" = t."sweepstakesId";

-- Update TaskProgress with participantId
UPDATE "TaskProgress" tp
SET "participantId" = p."id"
FROM "Task" t, "Participant" p
WHERE tp."taskId" = t."id"
  AND p."userId" = tp."userId"
  AND p."sweepstakesId" = t."sweepstakesId";

-- Update AgeVerification with participantId
UPDATE "AgeVerification" av
SET "participantId" = p."id"
FROM "Participant" p
WHERE av."userId" = p."userId"
  AND av."sweepstakesId" = p."sweepstakesId";

-- =============================================================================
-- PHASE 3: Make participantId required and cleanup old schema
-- =============================================================================

-- DropForeignKey
ALTER TABLE "AgeVerification" DROP CONSTRAINT "AgeVerification_sweepstakesId_fkey";
ALTER TABLE "AgeVerification" DROP CONSTRAINT "AgeVerification_userId_fkey";
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_userId_fkey";
ALTER TABLE "TaskProgress" DROP CONSTRAINT "TaskProgress_userId_fkey";

-- DropIndex
DROP INDEX "AgeVerification_userId_sweepstakesId_key";
DROP INDEX "TaskProgress_userId_taskId_key";

-- Make participantId NOT NULL
ALTER TABLE "TaskCompletion" ALTER COLUMN "participantId" SET NOT NULL;
ALTER TABLE "TaskProgress" ALTER COLUMN "participantId" SET NOT NULL;
ALTER TABLE "AgeVerification" ALTER COLUMN "participantId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "TaskCompletion" DROP COLUMN "userId";
ALTER TABLE "TaskProgress" DROP COLUMN "userId";
ALTER TABLE "AgeVerification" DROP COLUMN "sweepstakesId";

-- Make AgeVerification.userId optional
ALTER TABLE "AgeVerification" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AgeVerification_participantId_key" ON "AgeVerification"("participantId");
CREATE UNIQUE INDEX "TaskProgress_participantId_taskId_key" ON "TaskProgress"("participantId", "taskId");

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeVerification" ADD CONSTRAINT "AgeVerification_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeVerification" ADD CONSTRAINT "AgeVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
