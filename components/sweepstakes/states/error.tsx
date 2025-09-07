'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Error: React.FC = () => {
  return (
    <div className="text-center my-4">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-muted-foreground">
        An error occurred while loading this giveaway. Please try refreshing the page.
      </p>
    </div>
  );
};