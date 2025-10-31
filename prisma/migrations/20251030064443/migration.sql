/*
  Warnings:

  - You are about to drop the column `status` on the `Picker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Picker" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."PickerStatus";
