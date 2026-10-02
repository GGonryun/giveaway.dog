/*
  Warnings:

  - Made the column `allowMultipleWins` on table `SweepstakesWinnerCriteria` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SweepstakesJobType" AS ENUM ('FETCH_TWITTER_DATA', 'FETCH_TWITTER_GET_LIKING_USERS', 'FETCH_TWITTER_GET_REPOSTED_BY', 'FETCH_TWITTER_GET_QUOTED_POSTS');

-- CreateEnum
CREATE TYPE "SweepstakesJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "SweepstakesWinnerCriteria" ADD COLUMN     "externalPlatforms" JSONB,
ALTER COLUMN "allowMultipleWins" SET NOT NULL;

-- CreateTable
CREATE TABLE "SweepstakesJob" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "type" "SweepstakesJobType" NOT NULL,
    "status" "SweepstakesJobStatus" NOT NULL,
    "data" JSONB,
    "runAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweepstakesJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SweepstakesJob" ADD CONSTRAINT "SweepstakesJob_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
