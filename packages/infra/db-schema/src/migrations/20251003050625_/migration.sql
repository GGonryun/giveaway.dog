/*
  Warnings:

  - Added the required column `status` to the `PrizeWinners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PrizeWinners` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."WinnerStatus" AS ENUM ('SELECTED', 'CONFIRMED');

-- AlterTable
ALTER TABLE "public"."PrizeWinners" ADD COLUMN     "status" "public"."WinnerStatus" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
