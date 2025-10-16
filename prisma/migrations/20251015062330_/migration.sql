-- CreateTable
CREATE TABLE "SweepstakesVisibility" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweepstakesVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SweepstakesWinnerCriteria" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "minTasksCompleted" INTEGER DEFAULT 1,
    "minQualityScore" INTEGER DEFAULT 70,
    "allowMultipleWins" BOOLEAN DEFAULT false,

    CONSTRAINT "SweepstakesWinnerCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesVisibility_sweepstakesId_key" ON "SweepstakesVisibility"("sweepstakesId");

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesVisibility_url_key" ON "SweepstakesVisibility"("url");

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesWinnerCriteria_sweepstakesId_key" ON "SweepstakesWinnerCriteria"("sweepstakesId");

-- AddForeignKey
ALTER TABLE "SweepstakesVisibility" ADD CONSTRAINT "SweepstakesVisibility_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepstakesWinnerCriteria" ADD CONSTRAINT "SweepstakesWinnerCriteria_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
