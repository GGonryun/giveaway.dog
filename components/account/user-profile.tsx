'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useUser } from '@/components/context/user-provider';
import { useProcedure } from '@/lib/mrpc/hook';
import updateProfile from '@/procedures/user/update-profile';
import { toast } from 'sonner';
import { AccountSectionHeader } from './account-section-header';
import { SaveIcon } from 'lucide-react';
import { Spinner } from '../ui/spinner';
import { SocialProviders } from './social-providers';
import { EmailVerification } from '../auth/email-verification';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserProfileSchema, UpdateUserProfile } from '@/schemas/user';

export const UserSettings = () => {
  const user = useUser();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile updated successfully');
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: user?.name || ''
    }
  });

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileProcedure.run(data);
  };

  return (
    <div className="space-y-4">
      <Card>
        <AccountSectionHeader
          title="Display Name"
          description="This is the name that will be shown when you enter giveaways."
        />

        <CardContent className="flex grow flex-col max-w-2xl gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter your display name"
                        disabled={updateProfileProcedure.isLoading}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full sm:w-fit"
                size="sm"
                disabled={updateProfileProcedure.isLoading}
              >
                {updateProfileProcedure.isLoading ? (
                  <Spinner size="xs" />
                ) : (
                  <SaveIcon />
                )}
                {updateProfileProcedure.isLoading
                  ? 'Updating...'
                  : 'Update Name'}
              </Button>
            </form>
          </Form>
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
