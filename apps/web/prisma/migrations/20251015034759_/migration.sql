/*
  Warnings:

  - You are about to drop the column `countryCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `qualityScore` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "countryCode",
DROP COLUMN "qualityScore",
DROP COLUMN "userAgent";
