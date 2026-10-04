/*
  Warnings:

  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_teamId_fkey";

-- DropTable
DROP TABLE "Template";

-- DropEnum
DROP TYPE "TemplateType";
