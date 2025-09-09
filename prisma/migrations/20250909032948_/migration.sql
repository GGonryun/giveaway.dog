-- DropForeignKey
ALTER TABLE "public"."TaskCompletion" DROP CONSTRAINT "TaskCompletion_taskId_fkey";

-- AddForeignKey
ALTER TABLE "public"."TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
