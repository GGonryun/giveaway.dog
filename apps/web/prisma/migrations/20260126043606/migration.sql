/*
  Warnings:

  - You are about to drop the `TeamFeatureFlag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TeamFeatureFlag" DROP CONSTRAINT "TeamFeatureFlag_teamId_fkey";

-- DropTable
DROP TABLE "TeamFeatureFlag";
