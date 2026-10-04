-- Change all PRIVATE visibility sweepstakes to UNLISTED
UPDATE "SweepstakesVisibility" SET "visibility" = 'UNLISTED' WHERE "visibility" = 'PRIVATE';
