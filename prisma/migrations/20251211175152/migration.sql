/*
  Warnings:

  - The `type` column on the `SweepstakesFormField` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SweepstakesFormFieldType" AS ENUM ('USERNAME', 'AGE', 'EMAIL', 'TWITTER_HANDLE');

-- AlterTable
ALTER TABLE "SweepstakesFormField" DROP COLUMN "type",
ADD COLUMN     "type" "SweepstakesFormFieldType";

-- DropEnum
DROP TYPE "FormFieldType";
