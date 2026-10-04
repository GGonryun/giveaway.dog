/*
  Warnings:

  - You are about to drop the column `level` on the `PickerAuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PickerAuditLog" DROP COLUMN "level",
ADD COLUMN     "data" JSONB;
