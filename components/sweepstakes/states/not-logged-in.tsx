'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const NotLoggedIn: React.FC = () => {
  const { onLogin } = useGiveawayParticipation();

  return (
    <div className="text-center">
      <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-500" />
      <h3 className="text-lg font-semibold mb-2">Login Required</h3>
      <p className="text-muted-foreground mb-4">
        You need to log in to participate in this giveaway.
      </p>
      <Button onClick={onLogin} className="w-full sm:w-auto">
        Login to continue
      </Button>
    </div>
  );
};
