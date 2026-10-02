/*
  Warnings:

  - You are about to drop the column `sweepstakesId` on the `PrizeWinners` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PrizeWinners" DROP CONSTRAINT "PrizeWinners_sweepstakesId_fkey";

-- AlterTable
ALTER TABLE "public"."PrizeWinners" DROP COLUMN "sweepstakesId";
