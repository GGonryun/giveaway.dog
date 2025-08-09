'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Plus, Settings } from 'lucide-react';

export const EmptyTaskList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Entry Methods</h3>
          <Badge variant="outline">0/0 completed</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Entry Methods</h4>
          <p className="text-sm text-muted-foreground">
            Add entry methods in the Tasks step to see them here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const EmptyPrizeList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Prizes
        </h3>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Prizes</h4>
          <p className="text-sm text-muted-foreground">
            Add prizes in the Prizes step to see them here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

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