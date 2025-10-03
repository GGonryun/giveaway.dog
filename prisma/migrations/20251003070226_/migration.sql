/*
  Warnings:

  - You are about to drop the column `status` on the `PrizeWinners` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PrizeWinners` table. All the data in the column will be lost.
  - Added the required column `taskCompletionId` to the `PrizeWinners` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."PrizeWinners" DROP CONSTRAINT "PrizeWinners_userId_fkey";

-- AlterTable
ALTER TABLE "PrizeWinners" DROP COLUMN "status",
DROP COLUMN "userId",
ADD COLUMN     "taskCompletionId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."WinnerStatus";

-- AddForeignKey
ALTER TABLE "PrizeWinners" ADD CONSTRAINT "PrizeWinners_taskCompletionId_fkey" FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
