-- AlterTable
ALTER TABLE "UserFeatureFlag" RENAME CONSTRAINT "FeatureFlag_pkey" TO "UserFeatureFlag_pkey";

-- RenameForeignKey
ALTER TABLE "UserFeatureFlag" RENAME CONSTRAINT "FeatureFlag_userId_fkey" TO "UserFeatureFlag_userId_fkey";

-- RenameIndex
ALTER INDEX "FeatureFlag_key_userId_key" RENAME TO "UserFeatureFlag_key_userId_key";
