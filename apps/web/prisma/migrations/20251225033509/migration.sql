/*
  Warnings:

  - You are about to drop the column `error` on the `AutomatedPostJob` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `AutomatedPostJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AutomatedPostJob" DROP COLUMN "error",
DROP COLUMN "result",
ADD COLUMN     "response" JSONB;
