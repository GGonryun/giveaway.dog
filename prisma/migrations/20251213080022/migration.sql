/*
  Warnings:

  - You are about to drop the `AgeVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgeVerification" DROP CONSTRAINT "AgeVerification_participantId_fkey";

-- DropForeignKey
ALTER TABLE "AgeVerification" DROP CONSTRAINT "AgeVerification_userId_fkey";

-- DropTable
DROP TABLE "AgeVerification";
