'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const NotEligible: React.FC = () => {
  const { giveaway } = useGiveawayParticipation();

  return (
    <Card className="text-center border-destructive">
      <CardContent className="p-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Not Eligible</h3>
        <p className="text-muted-foreground mb-4">
          You are not eligible to participate in this giveaway due to age or
          region restrictions.
        </p>
        {giveaway.audience.minimumAgeRestriction && (
          <p className="text-sm text-muted-foreground">
            Minimum age: {giveaway.audience.minimumAgeRestriction.value} years
          </p>
        )}
        {giveaway.audience.regionalRestriction && (
          <p className="text-sm text-muted-foreground">
            Region restrictions apply
          </p>
        )}
      </CardContent>
    </Card>
  );
};
