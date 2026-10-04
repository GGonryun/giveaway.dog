/*
  Warnings:

  - You are about to drop the column `action` on the `PickerAuditLog` table. All the data in the column will be lost.
  - Added the required column `type` to the `PickerAuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PickerAuditLogType" AS ENUM ('CREATED', 'PUBLISHED', 'UPDATED', 'CANCELLED', 'COMPLETED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_FAILED', 'WINNER_DRAWN', 'WINNER_SELECTED', 'WINNER_DISQUALIFIED');

-- AlterTable
ALTER TABLE "PickerAuditLog" DROP COLUMN "action",
ADD COLUMN     "type" "PickerAuditLogType" NOT NULL;

-- DropEnum
DROP TYPE "public"."PickerAuditLogAction";
