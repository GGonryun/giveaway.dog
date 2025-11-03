/*
  Warnings:

  - You are about to drop the column `action` on the `PickerAuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PickerAuditLog" DROP COLUMN "action";

-- DropEnum
DROP TYPE "public"."PickerAuditLogAction";
