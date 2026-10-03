/*
  Warnings:

  - You are about to drop the column `conversationId` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `hashtags` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `inReplyToUserId` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `isQuoteStatus` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `media` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `mentions` on the `TwitterPost` table. All the data in the column will be lost.
  - You are about to drop the column `urls` on the `TwitterPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TwitterPost" DROP COLUMN "conversationId",
DROP COLUMN "hashtags",
DROP COLUMN "inReplyToUserId",
DROP COLUMN "isQuoteStatus",
DROP COLUMN "media",
DROP COLUMN "mentions",
DROP COLUMN "urls";
