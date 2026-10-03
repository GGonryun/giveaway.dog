/*
  Warnings:

  - You are about to drop the column `seed` on the `TwitterPicker` table. All the data in the column will be lost.
  - You are about to drop the column `tweetId` on the `TwitterPicker` table. All the data in the column will be lost.
  - Added the required column `pickerId` to the `TwitterPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TwitterPicker" DROP CONSTRAINT "TwitterPicker_tweetId_fkey";

-- AlterTable
ALTER TABLE "TwitterPicker" DROP COLUMN "seed",
DROP COLUMN "tweetId",
ADD COLUMN     "lastTweetDate" TIMESTAMP(3),
ADD COLUMN     "tweetUrls" TEXT[];

-- AlterTable
ALTER TABLE "TwitterPost" ADD COLUMN     "pickerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TwitterPost" ADD CONSTRAINT "TwitterPost_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "TwitterPicker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
