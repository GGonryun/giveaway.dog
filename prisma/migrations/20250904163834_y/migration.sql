/*
  Warnings:

  - You are about to drop the column `winners` on the `Prize` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Prize" DROP COLUMN "winners",
ADD COLUMN     "quota" INTEGER;

-- CreateTable
CREATE TABLE "public"."PrizeWinners" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PrizeWinners_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PrizeWinners" ADD CONSTRAINT "PrizeWinners_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrizeWinners" ADD CONSTRAINT "PrizeWinners_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "public"."Prize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrizeWinners" ADD CONSTRAINT "PrizeWinners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
