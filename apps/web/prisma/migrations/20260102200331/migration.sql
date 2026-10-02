/*
  Warnings:

  - You are about to drop the column `verified` on the `UserTurnstile` table. All the data in the column will be lost.
  - Made the column `success` on table `UserTurnstile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserTurnstile" DROP COLUMN "verified",
ADD COLUMN     "score" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "success" SET NOT NULL;
