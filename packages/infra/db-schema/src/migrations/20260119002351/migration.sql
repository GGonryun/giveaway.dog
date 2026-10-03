-- DropForeignKey
ALTER TABLE "Integration" DROP CONSTRAINT "Integration_stateId_fkey";

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;
