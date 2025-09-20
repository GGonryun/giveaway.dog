'use client';

import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import Link from 'next/link';

export const ProfileIncomplete = () => {
  const { userProfile } = useGiveawayParticipation();

  return (
    <div className="space-y-4 my-4 mb-6">
      <div>
        <h3 className="text-lg font-semibold">Complete Your Profile</h3>
        <p className="text-sm text-muted-foreground">
          Please complete your profile to participate in giveaways
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Profile Setup Required</p>
            <p className="text-sm text-muted-foreground">
              Your profile needs to be completed before you can participate
            </p>
          </div>
        </div>

        <Link href="/account">
          <Button className="w-full">
            Complete Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};
