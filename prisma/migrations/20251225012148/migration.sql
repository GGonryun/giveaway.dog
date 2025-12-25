/*
  Warnings:

  - You are about to drop the column `data` on the `AutomatedPostJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AutomatedPostJob" DROP COLUMN "data",
ADD COLUMN     "request" JSONB,
ADD COLUMN     "result" JSONB;
