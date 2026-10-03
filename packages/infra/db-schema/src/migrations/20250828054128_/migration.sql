/*
  Warnings:

  - You are about to drop the column `region` on the `RegionRestriction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sweepstakesId]` on the table `RegionRestriction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."RegionRestriction" DROP COLUMN "region",
ADD COLUMN     "regions" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "RegionRestriction_sweepstakesId_key" ON "public"."RegionRestriction"("sweepstakesId");
