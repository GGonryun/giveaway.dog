'use client';

import React from 'react';
import { useUser } from '@giveaway/account-context/user-provider';
import { useProcedure } from '@giveaway/rpc-client/hook';
import updateProfile from '@giveaway/account-server/update-profile';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SettingsCard } from '@giveaway/ui-layouts/settings-card';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import {
  IDENTITY_PROVIDER_LABEL,
  IdentityProviderSchema,
  isProviderType
} from '@giveaway/integration-model/providers';

export const UpdatePreferredContact = () => {
  const user = useUser();
  const router = useRouter();
  const [value, setValue] = React.useState<IdentityProviderSchema | 'none'>(
    user?.preferredContactMethod ?? 'none'
  );

  React.useEffect(() => {
    setValue(user?.preferredContactMethod ?? 'none');
  }, [user?.preferredContactMethod]);

  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Contact method updated successfully');
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to update contact method');
    }
  });

  const connectedProviders = user?.providers ?? [];
  const currentValue = user?.preferredContactMethod ?? null;
  const isInvalid =
    currentValue !== null &&
    !connectedProviders.find((p) => p.type === currentValue);
  const isDirty = value !== (user?.preferredContactMethod ?? 'none');

  const onSave = () => {
    updateProfileProcedure.run({
      preferredContactMethod: value !== 'none' ? value : null
    });
  };

  return (
    <SettingsCard
      title="Preferred Contact Method"
      description="How we'll reach you for prize notifications and giveaway updates."
      isSaving={updateProfileProcedure.isLoading}
      footer="Only accounts you've already connected to your profile can be selected."
      hasChanges={isDirty}
      onSave={onSave}
    >
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === 'none' || isProviderType(v)) setValue(v);
        }}
        disabled={updateProfileProcedure.isLoading}
      >
        <SelectTrigger className="max-w-xl">
          <SelectValue placeholder="Select a contact method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {connectedProviders.map((p) => (
            <SelectItem key={p.type} value={p.type}>
              {IDENTITY_PROVIDER_LABEL[p.type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircleIcon />
          <AlertDescription>
            The connected account you had selected is no longer linked to your
            profile. Choose a different one above.
          </AlertDescription>
        </Alert>
      )}
    </SettingsCard>
  );
};
