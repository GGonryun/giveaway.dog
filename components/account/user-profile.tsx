'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useUser } from '@/components/context/user-provider';
import { useProcedure } from '@/lib/mrpc/hook';
import updateProfile from '@/procedures/user/update-profile';
import { toast } from 'sonner';
import { SectionHeader } from './section-header';
import { SaveIcon } from 'lucide-react';
import { Spinner } from '../ui/spinner';
import { SocialProviders } from './social-providers';
import { EmailVerification } from '../auth/email-verification';

export const UserSettings = () => {
  const user = useUser();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile updated successfully');
    }
  });

  const [displayName, setDisplayName] = useState(user?.name || '');
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleSaveDisplayName = () => {
    updateProfileProcedure.run({ id: user.id, name: displayName });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="Display Name"
          description="This is the name that will be shown when you enter giveaways."
        />

        <CardContent className="flex grow flex-col max-w-2xl gap-2 ">
          <Input
            id="name"
            name="name"
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            disabled={updateProfileProcedure.isLoading}
            placeholder="Enter your display name"
          />
          <Button
            className="w-full sm:w-fit"
            disabled={updateProfileProcedure.isLoading}
            onClick={handleSaveDisplayName}
          >
            {updateProfileProcedure.isLoading ? (
              <Spinner size="xs" />
            ) : (
              <SaveIcon />
            )}
            {updateProfileProcedure.isLoading ? 'Updating...' : 'Update Name'}
          </Button>
        </CardContent>
      </Card>
      <EmailVerification
        user={user}
        redirectTo="/account"
        showCard={true}
        verificationText="Improve your account security by verifying your email address."
      />
      <SocialProviders />
    </div>
  );
};
