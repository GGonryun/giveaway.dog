'use client';

import React from 'react';
import { Clock } from 'lucide-react';

export const Closed: React.FC = () => {
  return (
    <div className="text-center my-4">
      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
      <h3 className="text-lg font-semibold mb-2">Giveaway Closed</h3>
      <p className="text-muted-foreground">
        This giveaway has ended and is no longer accepting entries.
      </p>
    </div>
  );
};
