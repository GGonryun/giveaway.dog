'use client';

import React from 'react';
import { XCircle } from 'lucide-react';

export const Cancelled: React.FC = () => {
  return (
    <div className="text-center my-4">
      <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold mb-2">Giveaway Cancelled</h3>
      <p className="text-muted-foreground">
        This giveaway has been cancelled by the host and is no longer available.
      </p>
    </div>
  );
};
