/*
  Warnings:

  - You are about to drop the column `status` on the `TaskJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TaskJob" DROP COLUMN "status";

-- DropEnum
DROP TYPE "TaskJobStatus";
