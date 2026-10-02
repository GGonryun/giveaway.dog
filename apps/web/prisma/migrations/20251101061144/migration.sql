/*
  Warnings:

  - Changed the type of `provider` on the `Integration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('TWITTER');

-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "provider",
ADD COLUMN     "provider" "IntegrationProvider" NOT NULL;
