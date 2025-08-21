/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Sweepstakes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Sweepstakes" DROP CONSTRAINT "Sweepstakes_creatorId_fkey";

-- AlterTable
ALTER TABLE "public"."Sweepstakes" DROP COLUMN "creatorId",
ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Sweepstakes" ADD CONSTRAINT "Sweepstakes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
