-- DropForeignKey
ALTER TABLE "TwitterPickerDraw" DROP CONSTRAINT "TwitterPickerDraw_pickerId_fkey";

-- AddForeignKey
ALTER TABLE "TwitterPickerDraw" ADD CONSTRAINT "TwitterPickerDraw_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "TwitterPicker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
