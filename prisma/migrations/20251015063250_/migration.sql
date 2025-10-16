-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "SweepstakesVisibility" ADD COLUMN     "visibility" "VisibilityType" NOT NULL DEFAULT 'PRIVATE';
