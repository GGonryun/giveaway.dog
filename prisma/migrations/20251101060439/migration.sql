-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'ERROR');

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE';
