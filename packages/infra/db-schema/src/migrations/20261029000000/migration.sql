-- CreateIndex
CREATE INDEX "UserQuality_userId_createdAt_idx" ON "UserQuality"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "TaskJob_status_runAt_idx" ON "TaskJob"("status", "runAt");

-- CreateIndex
CREATE INDEX "Participant_sweepstakesId_idx" ON "Participant"("sweepstakesId");

-- CreateIndex
CREATE INDEX "SweepstakesAllocation_prizeId_idx" ON "SweepstakesAllocation"("prizeId");

-- CreateIndex
CREATE INDEX "TaskCompletion_participantId_idx" ON "TaskCompletion"("participantId");

-- CreateIndex
CREATE INDEX "TaskCompletion_taskId_idx" ON "TaskCompletion"("taskId");

-- CreateIndex
CREATE INDEX "TwitterPickerDraw_pickerId_idx" ON "TwitterPickerDraw"("pickerId");

-- CreateIndex
CREATE INDEX "TwitterPickerDraw_userId_idx" ON "TwitterPickerDraw"("userId");
