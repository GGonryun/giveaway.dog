-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "stateId" TEXT;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;
