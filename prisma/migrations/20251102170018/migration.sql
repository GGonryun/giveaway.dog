/*
  Warnings:

  - You are about to drop the `PickerData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PickerData" DROP CONSTRAINT "PickerData_pickerId_fkey";

-- DropTable
DROP TABLE "public"."PickerData";

-- CreateTable
CREATE TABLE "PickerStorage" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickerStorage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickerStorage_pickerId_key" ON "PickerStorage"("pickerId");

-- AddForeignKey
ALTER TABLE "PickerStorage" ADD CONSTRAINT "PickerStorage_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "Picker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
