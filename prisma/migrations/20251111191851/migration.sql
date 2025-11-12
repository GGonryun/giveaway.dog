/*
  Warnings:

  - Added the required column `createdById` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "official" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamId" TEXT NOT NULL,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
