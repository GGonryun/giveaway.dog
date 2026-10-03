/*
  Warnings:

  - You are about to drop the column `data` on the `PickerJob` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `PickerJob` table. All the data in the column will be lost.
  - Added the required column `parentId` to the `PickerJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PickerJob" DROP COLUMN "data",
DROP COLUMN "type",
ADD COLUMN     "parentId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."PickerJobType";

-- AddForeignKey
ALTER TABLE "PickerJob" ADD CONSTRAINT "PickerJob_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PickerJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
