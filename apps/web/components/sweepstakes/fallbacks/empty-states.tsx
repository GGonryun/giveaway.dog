'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const IncompleteGiveawaySetup: React.FC = () => {
  return (
    <Card className="text-center">
      <CardContent className="p-8">
        <Settings className="h-12 w-12 mx-auto mb-4 text-blue-500" />
        <h3 className="text-lg font-semibold mb-2">Setup Your Giveaway</h3>
        <p className="text-muted-foreground mb-4">
          Complete the Setup step to see your giveaway preview.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Add a giveaway name</p>
          <p>• Set start and end dates</p>
          <p>• Configure entry methods</p>
          <p>• Add prizes</p>
        </div>
      </CardContent>
    </Card>
  );
};
