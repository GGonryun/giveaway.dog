'use client';

import React from 'react';
import { Hourglass } from 'lucide-react';

export const WinnersPending: React.FC = () => {
  return (
    <div className="text-center my-4">
      <Hourglass className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
      <h3 className="text-lg font-semibold mb-2">Winners Being Selected</h3>
      <p className="text-muted-foreground">
        This giveaway has ended and winners are being selected. Check back soon!
      </p>
    </div>
  );
};