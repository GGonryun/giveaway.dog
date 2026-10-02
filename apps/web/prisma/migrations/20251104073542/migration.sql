/*
  Warnings:

  - You are about to drop the `PickerStorage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PickerStorage" DROP CONSTRAINT "PickerStorage_pickerId_fkey";

-- AlterTable
ALTER TABLE "PickerDraw" ALTER COLUMN "previousDrawId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."PickerStorage";
