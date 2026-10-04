'use client';

import React from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { useUser } from '@giveaway/account-context/user-provider';
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
import { SettingsCard } from '@giveaway/ui-layouts/settings-card';
import { FileUpload } from '@giveaway/ui-file-upload/file-upload';

export const UpdateProfileImage = () => {
  const user = useUser();
  const router = useRouter();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile image updated successfully');
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to update profile image');
    }
  });

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      image: user?.image || null
    }
  });

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileProcedure.run(data);
  };

  return (
    <Form {...form}>
      <SettingsCard
        title="Profile Image"
        description="Upload a profile image that will be shown on your public profile."
        isSaving={updateProfileProcedure.isLoading}
        footer={'Accepted formats: JPEG, PNG, GIF. Max size: 3MB.'}
        hasChanges={form.formState.isDirty}
        onSave={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUpload
                  className="items-start"
                  initialUrl={field.value ?? undefined}
                  onUpload={(url) => field.onChange(url || null)}
                  size="md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsCard>
    </Form>
  );
};
