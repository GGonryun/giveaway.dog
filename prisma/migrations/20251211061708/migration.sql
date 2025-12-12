/*
  Warnings:

  - You are about to drop the column `sweepstakesAudienceId` on the `SweepstakesFormValue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SweepstakesFormValue" DROP CONSTRAINT "SweepstakesFormValue_sweepstakesAudienceId_fkey";

-- AlterTable
ALTER TABLE "SweepstakesFormValue" DROP COLUMN "sweepstakesAudienceId";
