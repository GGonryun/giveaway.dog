/*
  Warnings:

  - You are about to drop the `PickerConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PickerConfig" DROP CONSTRAINT "PickerConfig_pickerId_fkey";

-- DropTable
DROP TABLE "public"."PickerConfig";

-- CreateTable
CREATE TABLE "PickerForm" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickerForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickerForm_pickerId_key" ON "PickerForm"("pickerId");

-- AddForeignKey
ALTER TABLE "PickerForm" ADD CONSTRAINT "PickerForm_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
