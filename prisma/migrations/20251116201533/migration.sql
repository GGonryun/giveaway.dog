-- Rename table from "PrizeWinners" to "PrizeDraw" to match model name
-- This allows removing @@map("PrizeWinners") from the schema
ALTER TABLE "PrizeWinners" RENAME TO "PrizeDraw";

-- AlterTable
ALTER TABLE "PrizeDraw" RENAME CONSTRAINT "PrizeWinners_pkey" TO "PrizeDraw_pkey";

-- RenameForeignKey
ALTER TABLE "PrizeDraw" RENAME CONSTRAINT "PrizeWinners_previousDrawId_fkey" TO "PrizeDraw_previousDrawId_fkey";

-- RenameForeignKey
ALTER TABLE "PrizeDraw" RENAME CONSTRAINT "PrizeWinners_prizeId_fkey" TO "PrizeDraw_prizeId_fkey";

-- RenameForeignKey
ALTER TABLE "PrizeDraw" RENAME CONSTRAINT "PrizeWinners_taskCompletionId_fkey" TO "PrizeDraw_taskCompletionId_fkey";

-- RenameIndex
ALTER INDEX "PrizeWinners_previousDrawId_key" RENAME TO "PrizeDraw_previousDrawId_key";
