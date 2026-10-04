/*
  Warnings:

  - You are about to drop the `RegionRestriction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."RegionalRestrictionFilter" AS ENUM ('INCLUDE', 'EXCLUDE');

-- DropForeignKey
ALTER TABLE "public"."RegionRestriction" DROP CONSTRAINT "RegionRestriction_audienceId_fkey";

-- DropTable
DROP TABLE "public"."RegionRestriction";

-- DropEnum
DROP TYPE "public"."RegionRestrictionFilter";

-- CreateTable
CREATE TABLE "public"."RegionalRestriction" (
    "id" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "filter" "public"."RegionalRestrictionFilter",
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "RegionalRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionalRestriction_audienceId_key" ON "public"."RegionalRestriction"("audienceId");

-- AddForeignKey
ALTER TABLE "public"."RegionalRestriction" ADD CONSTRAINT "RegionalRestriction_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "public"."SweepstakesAudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
