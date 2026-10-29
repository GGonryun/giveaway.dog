-- AlterTable
ALTER TABLE "TaskJob" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" JSONB;
