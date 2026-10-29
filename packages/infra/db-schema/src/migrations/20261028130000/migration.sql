-- AlterTable
ALTER TABLE "AutomatedPostJob" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SweepstakesJob" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;
