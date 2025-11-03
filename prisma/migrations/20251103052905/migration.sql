-- AlterTable
ALTER TABLE "PickerJob" ADD COLUMN     "data" JSONB,
ALTER COLUMN "parentId" DROP NOT NULL;
