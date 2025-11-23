/*
  Warnings:

  - You are about to drop the `SweepstakesJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "SweepstakesJob" DROP CONSTRAINT "SweepstakesJob_sweepstakesId_fkey";

-- DropTable
DROP TABLE "SweepstakesJob";

-- DropEnum
DROP TYPE "SweepstakesJobStatus";

-- DropEnum
DROP TYPE "SweepstakesJobType";

-- CreateTable
CREATE TABLE "TaskJob" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "TaskJobStatus" NOT NULL,
    "data" JSONB,
    "runAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskJob" ADD CONSTRAINT "TaskJob_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
