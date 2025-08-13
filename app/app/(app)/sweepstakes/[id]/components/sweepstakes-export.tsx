'use client';

import { SweepstakesExportModal } from './sweepstakes-export-modal';

interface SweepstakesExportProps {
  sweepstakesId: string;
}

export const SweepstakesExport = ({ sweepstakesId }: SweepstakesExportProps) => {
  return <SweepstakesExportModal />;
};
