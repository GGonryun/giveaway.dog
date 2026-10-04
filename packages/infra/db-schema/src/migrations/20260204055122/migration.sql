-- CreateEnum
CREATE TYPE "TeamTier" AS ENUM ('FREE', 'PRO', 'ELITE', 'ALPHA');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "tier" "TeamTier" NOT NULL DEFAULT 'FREE';
