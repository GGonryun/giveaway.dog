/*
  Warnings:

  - You are about to drop the column `metrics` on the `UserQuality` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SweepstakesWinnerCriteria" ALTER COLUMN "minQualityScore" SET DEFAULT 50;

-- AlterTable
ALTER TABLE "UserQuality" DROP COLUMN "metrics";
