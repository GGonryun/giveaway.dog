/*
  Warnings:

  - Added the required column `action` to the `PickerAuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PickerAuditLogAction" AS ENUM ('CREATED', 'PUBLISHED', 'UPDATED', 'CANCELLED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_FAILED', 'WINNER_DRAWN', 'WINNER_SELECTED', 'WINNER_DISQUALIFIED');

-- AlterTable
ALTER TABLE "PickerAuditLog" ADD COLUMN     "action" "PickerAuditLogAction" NOT NULL;
