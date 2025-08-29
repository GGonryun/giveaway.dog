/*
  Warnings:

  - You are about to drop the column `terms` on the `Sweepstakes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TermsAndConditionsType" AS ENUM ('TEMPLATE', 'CUSTOM');

-- AlterTable
ALTER TABLE "public"."Sweepstakes" DROP COLUMN "terms";

-- CreateTable
CREATE TABLE "public"."TermsAndConditions" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "type" "public"."TermsAndConditionsType",
    "sponsorName" TEXT,
    "sponsorAddress" TEXT,
    "winnerSelectionMethod" TEXT,
    "notificationTimeframeDays" INTEGER,
    "claimDeadlineDays" INTEGER,
    "governingLawCountry" TEXT,
    "privacyPolicyUrl" TEXT,
    "additionalTerms" TEXT,
    "text" TEXT,

    CONSTRAINT "TermsAndConditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermsAndConditions_sweepstakesId_key" ON "public"."TermsAndConditions"("sweepstakesId");

-- AddForeignKey
ALTER TABLE "public"."TermsAndConditions" ADD CONSTRAINT "TermsAndConditions_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
