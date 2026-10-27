-- DropForeignKey
ALTER TABLE "PrizeDraw" DROP CONSTRAINT "PrizeDraw_previousDrawId_fkey";

-- AddForeignKey
ALTER TABLE "PrizeDraw" ADD CONSTRAINT "PrizeDraw_previousDrawId_fkey" FOREIGN KEY ("previousDrawId") REFERENCES "PrizeDraw"("id") ON DELETE SET NULL ON UPDATE CASCADE;
