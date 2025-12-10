/*
  Warnings:

  - You are about to drop the column `aspectRatio` on the `SweepstakesVisibility` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SweepstakesDesign" ADD COLUMN     "aspectRatio" TEXT NOT NULL DEFAULT 'VIDEO';

-- AlterTable
ALTER TABLE "SweepstakesVisibility" DROP COLUMN "aspectRatio";
