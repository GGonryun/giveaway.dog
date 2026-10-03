/*
  Warnings:

  - You are about to drop the column `processedBy` on the `UserQuality` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `UserQuality` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserQuality" DROP COLUMN "processedBy",
DROP COLUMN "reason",
ADD COLUMN     "metrics" JSONB;
