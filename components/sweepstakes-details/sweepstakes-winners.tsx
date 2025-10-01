'use client';

import { SlotBasedWinnerSystem } from './slot-based-winner-system';

interface SweepstakesWinnersProps {
  sweepstakesId: string;
}

export const SweepstakesWinners = ({
  sweepstakesId
}: SweepstakesWinnersProps) => {
  // Default prizes for the slot system
  const prizes = [
    { id: 'prize-1', name: 'iPhone 15 Pro Max', position: 1 },
    { id: 'prize-2', name: '$500 Gift Card', position: 2 },
    { id: 'prize-3', name: '$250 Gift Card', position: 3 }
  ];

  return (
    <SlotBasedWinnerSystem
      sweepstakesId={sweepstakesId}
      prizes={prizes}
    />
  );
};
