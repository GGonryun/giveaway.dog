/*
  Warnings:

  - Made the column `pickerId` on table `TwitterPickerDraw` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `TwitterPickerDraw` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TwitterPickerDraw" DROP CONSTRAINT "TwitterPickerDraw_pickerId_fkey";

-- AlterTable
ALTER TABLE "TwitterPickerDraw" ALTER COLUMN "pickerId" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TwitterPickerDraw" ADD CONSTRAINT "TwitterPickerDraw_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "TwitterPicker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
