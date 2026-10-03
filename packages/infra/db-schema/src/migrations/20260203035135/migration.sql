/*
  Warnings:

  - You are about to drop the column `lastTweetDate` on the `TwitterPicker` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LastPostedType" AS ENUM ('PAST_DAY', 'PAST_WEEK', 'PAST_MONTH');

-- AlterTable
ALTER TABLE "TwitterPicker" DROP COLUMN "lastTweetDate",
ADD COLUMN     "lastPostWithin" "LastPostedType";
