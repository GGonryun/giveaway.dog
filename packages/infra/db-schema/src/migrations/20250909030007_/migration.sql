/*
  Warnings:

  - Made the column `taskId` on table `TaskCompletion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."TaskCompletion" DROP CONSTRAINT "TaskCompletion_taskId_fkey";

-- AlterTable
ALTER TABLE "public"."TaskCompletion" ALTER COLUMN "taskId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
