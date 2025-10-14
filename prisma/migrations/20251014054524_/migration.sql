/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserScoringRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserScoringRequest_userId_key" ON "UserScoringRequest"("userId");
