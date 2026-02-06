-- CreateEnum
CREATE TYPE "TaskJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "TaskJob" ADD COLUMN     "status" "TaskJobStatus" NOT NULL DEFAULT 'PENDING';
