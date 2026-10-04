/*
  Warnings:

  - The `format` column on the `MinimumAgeRestriction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."MinimumAgeRestrictionFormat" AS ENUM ('CHECKBOX');

-- AlterTable
ALTER TABLE "public"."MinimumAgeRestriction" ALTER COLUMN "value" DROP NOT NULL,
ALTER COLUMN "label" DROP NOT NULL,
ALTER COLUMN "required" DROP NOT NULL,
DROP COLUMN "format",
ADD COLUMN     "format" "public"."MinimumAgeRestrictionFormat" DEFAULT 'CHECKBOX';

-- AlterTable
ALTER TABLE "public"."RegionRestriction" ALTER COLUMN "filter" DROP NOT NULL,
ALTER COLUMN "regions" SET DEFAULT ARRAY[]::TEXT[];
