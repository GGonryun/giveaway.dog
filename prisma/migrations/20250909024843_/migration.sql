-- DropForeignKey
ALTER TABLE "public"."TaskCompletion" DROP CONSTRAINT "TaskCompletion_taskId_fkey";

-- AlterTable
ALTER TABLE "public"."TaskCompletion" ALTER COLUMN "taskId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
