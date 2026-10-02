-- CreateTable
CREATE TABLE "SweepstakesAllocation" (
    "id" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweepstakesAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesAllocation_prizeId_participantId_key" ON "SweepstakesAllocation"("prizeId", "participantId");

-- AddForeignKey
ALTER TABLE "SweepstakesAllocation" ADD CONSTRAINT "SweepstakesAllocation_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepstakesAllocation" ADD CONSTRAINT "SweepstakesAllocation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
