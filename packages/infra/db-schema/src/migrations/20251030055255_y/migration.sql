-- CreateEnum
CREATE TYPE "PickerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PickerType" AS ENUM ('TWITTER');

-- CreateTable
CREATE TABLE "Picker" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "status" "PickerStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "PickerType" NOT NULL DEFAULT 'TWITTER',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Picker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Picker" ADD CONSTRAINT "Picker_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
