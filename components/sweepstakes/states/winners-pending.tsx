'use client';

import React from 'react';
import { Hourglass } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const WinnersPending: React.FC = () => {
  return (
    <Alert variant="warning">
      <Hourglass className="h-4 w-4" />
      <AlertTitle>Winners Being Selected</AlertTitle>
      <AlertDescription>
        This giveaway has ended and winners are being selected. Check back soon
        to see the results!
      </AlertDescription>
    </Alert>
  );
};
