/*
  Warnings:

  - You are about to drop the `Picker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PickerAuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PickerDraw` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PickerForm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PickerJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Picker" DROP CONSTRAINT "Picker_teamId_fkey";

-- DropForeignKey
ALTER TABLE "PickerAuditLog" DROP CONSTRAINT "PickerAuditLog_pickerId_fkey";

-- DropForeignKey
ALTER TABLE "PickerDraw" DROP CONSTRAINT "PickerDraw_pickerId_fkey";

-- DropForeignKey
ALTER TABLE "PickerDraw" DROP CONSTRAINT "PickerDraw_previousDrawId_fkey";

-- DropForeignKey
ALTER TABLE "PickerForm" DROP CONSTRAINT "PickerForm_pickerId_fkey";

-- DropForeignKey
ALTER TABLE "PickerJob" DROP CONSTRAINT "PickerJob_parentId_fkey";

-- DropForeignKey
ALTER TABLE "PickerJob" DROP CONSTRAINT "PickerJob_pickerId_fkey";

-- DropTable
DROP TABLE "Picker";

-- DropTable
DROP TABLE "PickerAuditLog";

-- DropTable
DROP TABLE "PickerDraw";

-- DropTable
DROP TABLE "PickerForm";

-- DropTable
DROP TABLE "PickerJob";

-- DropEnum
DROP TYPE "PickerAuditLogType";

-- DropEnum
DROP TYPE "PickerDrawResult";

-- DropEnum
DROP TYPE "PickerJobStatus";

-- DropEnum
DROP TYPE "PickerJobType";

-- DropEnum
DROP TYPE "PickerType";
