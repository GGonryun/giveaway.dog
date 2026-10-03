/*
  Warnings:

  - You are about to drop the column `twitterPickerId` on the `TwitterPickerUser` table. All the data in the column will be lost.
  - Added the required column `pickerId` to the `TwitterPickerUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TwitterPickerUser" DROP CONSTRAINT "TwitterPickerUser_twitterPickerId_fkey";

-- AlterTable
ALTER TABLE "TwitterPickerUser" DROP COLUMN "twitterPickerId",
ADD COLUMN     "pickerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TwitterPickerUser" ADD CONSTRAINT "TwitterPickerUser_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "TwitterPicker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
