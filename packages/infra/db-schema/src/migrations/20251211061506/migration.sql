-- CreateTable
CREATE TABLE "SweepstakesFormField" (
    "id" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "index" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweepstakesFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SweepstakesFormValue" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sweepstakesAudienceId" TEXT,

    CONSTRAINT "SweepstakesFormValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesFormValue_participantId_fieldId_key" ON "SweepstakesFormValue"("participantId", "fieldId");

-- AddForeignKey
ALTER TABLE "SweepstakesFormField" ADD CONSTRAINT "SweepstakesFormField_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "SweepstakesAudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepstakesFormValue" ADD CONSTRAINT "SweepstakesFormValue_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepstakesFormValue" ADD CONSTRAINT "SweepstakesFormValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "SweepstakesFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepstakesFormValue" ADD CONSTRAINT "SweepstakesFormValue_sweepstakesAudienceId_fkey" FOREIGN KEY ("sweepstakesAudienceId") REFERENCES "SweepstakesAudience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
