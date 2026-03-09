/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserAccountType" AS ENUM ('PARTICIPANT', 'HOST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "UserAccountType" NOT NULL DEFAULT 'PARTICIPANT',
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false;
