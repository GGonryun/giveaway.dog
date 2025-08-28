'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const ProfileIncomplete: React.FC = () => {
  const { onCompleteProfile } = useGiveawayParticipation();

  return (
    <Card className="text-center">
      <CardContent className="p-8">
        <User className="h-12 w-12 mx-auto mb-4 text-orange-500" />
        <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
        <p className="text-muted-foreground mb-4">
          Please complete your profile to participate in this giveaway. You need
          to provide your birthday, email, and region.
        </p>
        <Button onClick={onCompleteProfile} className="w-full sm:w-auto">
          Complete Profile
        </Button>
      </CardContent>
    </Card>
  );
};
