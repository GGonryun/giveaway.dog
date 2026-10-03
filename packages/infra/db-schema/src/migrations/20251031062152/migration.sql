/*
  Warnings:

  - The values [PENDING] on the enum `PickerStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PickerStatus_new" AS ENUM ('DRAFT', 'PROCESSING', 'PROCESSED', 'COMPLETE', 'SUSPENDED', 'CANCELLED', 'FAILED');
ALTER TABLE "public"."Picker" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Picker" ALTER COLUMN "status" TYPE "PickerStatus_new" USING ("status"::text::"PickerStatus_new");
ALTER TYPE "PickerStatus" RENAME TO "PickerStatus_old";
ALTER TYPE "PickerStatus_new" RENAME TO "PickerStatus";
DROP TYPE "public"."PickerStatus_old";
ALTER TABLE "Picker" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
COMMIT;

-- AlterTable
ALTER TABLE "Picker" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
