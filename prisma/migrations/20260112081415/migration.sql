/*
  Warnings:

  - A unique constraint covering the columns `[participantId]` on the table `SweepstakesAllocation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SweepstakesAllocation_prizeId_participantId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesAllocation_participantId_key" ON "SweepstakesAllocation"("participantId");
