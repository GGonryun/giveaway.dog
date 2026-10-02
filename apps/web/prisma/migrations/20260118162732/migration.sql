/*
  Warnings:

  - A unique constraint covering the columns `[stateId]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Integration_stateId_key" ON "Integration"("stateId");
