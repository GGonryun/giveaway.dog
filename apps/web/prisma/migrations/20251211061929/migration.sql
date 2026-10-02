/*
  Warnings:

  - The `options` column on the `SweepstakesFormField` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `SweepstakesFormField` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'CHECKBOX');

-- AlterTable
ALTER TABLE "SweepstakesFormField" DROP COLUMN "type",
ADD COLUMN     "type" "FormFieldType" NOT NULL,
DROP COLUMN "options",
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
