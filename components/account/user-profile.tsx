'use client';

import React from 'react';
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
import { EmailVerification } from '../auth/email-verification';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserProfileSchema, UpdateUserProfile } from '@/schemas/user';
import { useRouter } from 'next/navigation';
import { SocialProviders } from '@/lib/auth/components/social-providers';
import { SettingsCard } from '../settings/settings-card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircleIcon } from 'lucide-react';

export const UserSettings = () => {
  const user = useUser();
  const router = useRouter();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile updated successfully');
      router.refresh();
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
      <Form {...form}>
        <SettingsCard
          title="Display Name"
          description="This is the name that will be shown when you enter giveaways."
          isSaving={updateProfileProcedure.isLoading}
          footer={'Name must be between 5 and 30 characters long.'}
          hasChanges={form.formState.isDirty}
          onSave={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="max-w-xl"
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
          {user.isAnonymous && (
            <Alert variant="warning" className="mt-4">
              <AlertCircleIcon />
              <AlertDescription>
                You are currently using an anonymous account. Please consider
                creating a full account to save your profile and giveaway
                entries.
              </AlertDescription>
            </Alert>
          )}
        </SettingsCard>
      </Form>
      <EmailVerification
        verifyEmail
        user={user}
        redirectTo="/account"
        showCard={true}
        verificationText="Improve your account security by verifying your email address."
      />
      <SocialProviders />
    </div>
  );
};
