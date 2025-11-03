/*
  Warnings:

  - Added the required column `type` to the `PickerJob` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PickerJobType" AS ENUM ('FETCH_TWITTER_DATA', 'FETCH_TWITTER_GET_LIKING_USERS', 'FETCH_TWITTER_GET_REPOSTED_BY', 'FETCH_TWITTER_GET_QUOTED_POSTS');

-- AlterTable
ALTER TABLE "PickerJob" ADD COLUMN     "type" "PickerJobType" NOT NULL;
