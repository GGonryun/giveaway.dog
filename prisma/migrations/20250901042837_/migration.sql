/*
  Warnings:

  - You are about to drop the column `sweepstakesId` on the `MinimumAgeRestriction` table. All the data in the column will be lost.
  - You are about to drop the column `sweepstakesId` on the `RegionRestriction` table. All the data in the column will be lost.
  - You are about to drop the column `banner` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `requireEmail` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the column `timeZone` on the `Sweepstakes` table. All the data in the column will be lost.
  - You are about to drop the `TermsAndConditions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[audienceId]` on the table `MinimumAgeRestriction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[audienceId]` on the table `RegionRestriction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `audienceId` to the `MinimumAgeRestriction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `audienceId` to the `RegionRestriction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SweepstakesTermsType" AS ENUM ('TEMPLATE', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" DROP CONSTRAINT "MinimumAgeRestriction_sweepstakesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegionRestriction" DROP CONSTRAINT "RegionRestriction_sweepstakesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TermsAndConditions" DROP CONSTRAINT "TermsAndConditions_sweepstakesId_fkey";

-- DropIndex
DROP INDEX "public"."MinimumAgeRestriction_sweepstakesId_key";

-- DropIndex
DROP INDEX "public"."RegionRestriction_sweepstakesId_key";

-- AlterTable
ALTER TABLE "public"."MinimumAgeRestriction" DROP COLUMN "sweepstakesId",
ADD COLUMN     "audienceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."RegionRestriction" DROP COLUMN "sweepstakesId",
ADD COLUMN     "audienceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sweepstakes" DROP COLUMN "banner",
DROP COLUMN "description",
DROP COLUMN "endDate",
DROP COLUMN "name",
DROP COLUMN "requireEmail",
DROP COLUMN "startDate",
DROP COLUMN "timeZone";

-- DropTable
DROP TABLE "public"."TermsAndConditions";

-- DropEnum
DROP TYPE "public"."TermsAndConditionsType";

-- CreateTable
CREATE TABLE "public"."SweepstakesTiming" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeZone" TEXT,

    CONSTRAINT "SweepstakesTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SweepstakesDetails" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "banner" TEXT,

    CONSTRAINT "SweepstakesDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SweepstakesAudience" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "requireEmail" BOOLEAN,

    CONSTRAINT "SweepstakesAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SweepstakesTerms" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "type" "public"."SweepstakesTermsType",
    "sponsorName" TEXT,
    "sponsorAddress" TEXT,
    "winnerSelectionMethod" TEXT,
    "notificationTimeframeDays" INTEGER,
    "maxEntriesPerUser" INTEGER,
    "claimDeadlineDays" INTEGER,
    "governingLawCountry" TEXT,
    "privacyPolicyUrl" TEXT,
    "additionalTerms" TEXT,
    "text" TEXT,

    CONSTRAINT "SweepstakesTerms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesTiming_sweepstakesId_key" ON "public"."SweepstakesTiming"("sweepstakesId");

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesDetails_sweepstakesId_key" ON "public"."SweepstakesDetails"("sweepstakesId");

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesAudience_sweepstakesId_key" ON "public"."SweepstakesAudience"("sweepstakesId");

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesTerms_sweepstakesId_key" ON "public"."SweepstakesTerms"("sweepstakesId");

-- CreateIndex
CREATE UNIQUE INDEX "MinimumAgeRestriction_audienceId_key" ON "public"."MinimumAgeRestriction"("audienceId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionRestriction_audienceId_key" ON "public"."RegionRestriction"("audienceId");

-- AddForeignKey
ALTER TABLE "public"."SweepstakesTiming" ADD CONSTRAINT "SweepstakesTiming_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SweepstakesDetails" ADD CONSTRAINT "SweepstakesDetails_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SweepstakesAudience" ADD CONSTRAINT "SweepstakesAudience_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SweepstakesTerms" ADD CONSTRAINT "SweepstakesTerms_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionRestriction" ADD CONSTRAINT "RegionRestriction_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "public"."SweepstakesAudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" ADD CONSTRAINT "MinimumAgeRestriction_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "public"."SweepstakesAudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
