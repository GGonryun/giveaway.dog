/*
  Warnings:

  - You are about to drop the `UserFeatureFlag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserFeatureFlag" DROP CONSTRAINT "UserFeatureFlag_userId_fkey";

-- DropTable
DROP TABLE "UserFeatureFlag";
