/*
  Warnings:

  - You are about to drop the column `config` on the `Picker` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Picker` table. All the data in the column will be lost.
  - You are about to drop the column `draws` on the `Picker` table. All the data in the column will be lost.
  - You are about to drop the column `job` on the `Picker` table. All the data in the column will be lost.
  - You are about to drop the column `logs` on the `Picker` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PickerAuditLogAction" AS ENUM ('CREATE_PICKER', 'START_SYNC', 'COMPLETE_SYNC', 'FAIL_SYNC', 'SUSPEND_PICKER', 'RESUME_PICKER', 'CANCEL_PICKER', 'COMPLETE_PICKER');

-- CreateEnum
CREATE TYPE "PickerJobType" AS ENUM ('FETCH_TWITTER_DATA');

-- CreateEnum
CREATE TYPE "PickerJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PickerDrawResult" AS ENUM ('ELIGIBLE', 'WINNER', 'DISQUALIFIED');

-- AlterTable
ALTER TABLE "Picker" DROP COLUMN "config",
DROP COLUMN "data",
DROP COLUMN "draws",
DROP COLUMN "job",
DROP COLUMN "logs";

-- CreateTable
CREATE TABLE "PickerConfig" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickerData" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickerData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickerAuditLog" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "action" "PickerAuditLogAction" NOT NULL,
    "level" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickerJob" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "type" "PickerJobType" NOT NULL,
    "status" "PickerJobStatus" NOT NULL,
    "data" JSONB,
    "runAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickerDraw" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "eligibleEntries" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "result" "PickerDrawResult" NOT NULL,
    "disqualificationReason" TEXT,
    "previousDrawId" TEXT NOT NULL,

    CONSTRAINT "PickerDraw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickerConfig_pickerId_key" ON "PickerConfig"("pickerId");

-- CreateIndex
CREATE UNIQUE INDEX "PickerData_pickerId_key" ON "PickerData"("pickerId");

-- CreateIndex
CREATE UNIQUE INDEX "PickerDraw_previousDrawId_key" ON "PickerDraw"("previousDrawId");

-- AddForeignKey
ALTER TABLE "PickerConfig" ADD CONSTRAINT "PickerConfig_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickerData" ADD CONSTRAINT "PickerData_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickerAuditLog" ADD CONSTRAINT "PickerAuditLog_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickerJob" ADD CONSTRAINT "PickerJob_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickerDraw" ADD CONSTRAINT "PickerDraw_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickerDraw" ADD CONSTRAINT "PickerDraw_previousDrawId_fkey" FOREIGN KEY ("previousDrawId") REFERENCES "PickerDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
