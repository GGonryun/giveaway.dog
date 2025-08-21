/*
  Warnings:

  - You are about to drop the column `giveawayId` on the `MinimumAgeRestriction` table. All the data in the column will be lost.
  - You are about to drop the column `giveawayId` on the `Prize` table. All the data in the column will be lost.
  - You are about to drop the column `giveawayId` on the `RegionRestriction` table. All the data in the column will be lost.
  - You are about to drop the column `giveawayId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Giveaway` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sweepstakesId]` on the table `MinimumAgeRestriction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sweepstakesId` to the `MinimumAgeRestriction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sweepstakesId` to the `Prize` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sweepstakesId` to the `RegionRestriction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sweepstakesId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SweepstakesStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PAUSED', 'CANCELED', 'ACTIVE', 'ENDED');

-- DropForeignKey
ALTER TABLE "public"."Giveaway" DROP CONSTRAINT "Giveaway_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" DROP CONSTRAINT "MinimumAgeRestriction_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Prize" DROP CONSTRAINT "Prize_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegionRestriction" DROP CONSTRAINT "RegionRestriction_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_giveawayId_fkey";

-- DropIndex
DROP INDEX "public"."MinimumAgeRestriction_giveawayId_key";

-- AlterTable
ALTER TABLE "public"."MinimumAgeRestriction" DROP COLUMN "giveawayId",
ADD COLUMN     "sweepstakesId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Prize" DROP COLUMN "giveawayId",
ADD COLUMN     "sweepstakesId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."RegionRestriction" DROP COLUMN "giveawayId",
ADD COLUMN     "sweepstakesId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "giveawayId",
ADD COLUMN     "sweepstakesId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Giveaway";

-- DropEnum
DROP TYPE "public"."GiveawayStatus";

-- CreateTable
CREATE TABLE "public"."Sweepstakes" (
    "id" TEXT NOT NULL,
    "status" "public"."SweepstakesStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "terms" TEXT,
    "banner" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeZone" TEXT,
    "requireEmail" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sweepstakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinimumAgeRestriction_sweepstakesId_key" ON "public"."MinimumAgeRestriction"("sweepstakesId");

-- AddForeignKey
ALTER TABLE "public"."Sweepstakes" ADD CONSTRAINT "Sweepstakes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionRestriction" ADD CONSTRAINT "RegionRestriction_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" ADD CONSTRAINT "MinimumAgeRestriction_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prize" ADD CONSTRAINT "Prize_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
