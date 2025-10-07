-- CreateTable
CREATE TABLE "SweepstakesDesign" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "SweepstakesDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesDesign_sweepstakesId_key" ON "SweepstakesDesign"("sweepstakesId");

-- AddForeignKey
ALTER TABLE "SweepstakesDesign" ADD CONSTRAINT "SweepstakesDesign_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
