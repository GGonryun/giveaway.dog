/*
  Warnings:

  - A unique constraint covering the columns `[previousDrawId]` on the table `PrizeWinners` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `result` to the `PrizeWinners` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrizeDrawResult" AS ENUM ('WINNER', 'DISQUALIFIED');

-- AlterTable
ALTER TABLE "PrizeWinners" ADD COLUMN     "disqualificationReason" TEXT,
ADD COLUMN     "previousDrawId" TEXT,
ADD COLUMN     "result" "PrizeDrawResult" NOT NULL DEFAULT 'WINNER';

-- CreateIndex
CREATE UNIQUE INDEX "PrizeWinners_previousDrawId_key" ON "PrizeWinners"("previousDrawId");

-- AddForeignKey
ALTER TABLE "PrizeWinners" ADD CONSTRAINT "PrizeWinners_previousDrawId_fkey" FOREIGN KEY ("previousDrawId") REFERENCES "PrizeWinners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
