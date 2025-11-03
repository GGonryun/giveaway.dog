/*
  Warnings:

  - You are about to drop the column `timestamp` on the `PickerAuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PickerAuditLog" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
