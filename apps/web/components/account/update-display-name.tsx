'use client';

import React from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { useUser } from '@/components/context/user-provider';
import { useProcedure } from '@giveaway/rpc-client/hook';
import updateProfile from '@/procedures/user/update-profile';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateUserProfileSchema,
  UpdateUserProfile
} from '@giveaway/user-model/user';
import { useRouter } from 'next/navigation';
import { SettingsCard } from '../settings/settings-card';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';

export const UpdateDisplayName = () => {
  const user = useUser();
  const router = useRouter();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Display name updated successfully');
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to update display name');
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
              creating a full account to save your profile and giveaway entries.
            </AlertDescription>
          </Alert>
        )}
      </SettingsCard>
    </Form>
  );
};
