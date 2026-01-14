-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ERROR');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
