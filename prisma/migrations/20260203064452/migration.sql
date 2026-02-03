/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `TwitterPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TwitterPost" DROP COLUMN "updatedAt",
ALTER COLUMN "createdAt" DROP DEFAULT;
