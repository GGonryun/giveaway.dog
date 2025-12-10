import { Button } from '@/components/ui/button';
import {
  ProviderIcon,
  ThemedProviderIcon
} from '@/lib/integrations/components/icons/provider-icon';
import {
  IDENTITY_PROVIDER_LABEL,
  ENABLED_IDENTITY_PROVIDERS
} from '@/lib/integrations/schemas/providers';
import { IdentityProvider } from '@prisma/client';
import React from 'react';

type ProviderButtonsProps = {
  identities: IdentityProvider[];
  onSubmit: (provider: IdentityProvider) => void;
};

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit
}: ProviderButtonsProps) => {
  const actionText = 'Login';

  return (
    <div className="flex flex-col gap-3 w-full">
      {identities.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          name="provider"
          value={provider}
          disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
          formNoValidate
          className="w-full justify-center items-center relative"
          onClick={() => onSubmit(provider)}
        >
          <ProviderIcon
            type={provider}
            className="absolute left-4 h-4 w-4"
          />
          <span>
            {actionText} with {IDENTITY_PROVIDER_LABEL[provider]}
          </span>
        </Button>
      ))}
    </div>
  );
};

export const ProviderIcons: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit
}) => {
  return (
    <div className="flex flex-row gap-2 w-full items-center justify-center">
      {identities.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          size="icon"
          name="provider"
          value={provider}
          disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
          formNoValidate
          aria-label={`Login with ${IDENTITY_PROVIDER_LABEL[provider]}`}
          onClick={() => onSubmit(provider)}
        >
          <ProviderIcon type={provider} />
        </Button>
      ))}
    </div>
  );
};

export const ProviderBadges: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit
}) => {
  return (
    <div className="flex flex-wrap flex-row gap-1 w-full items-center justify-center">
      {identities.map((provider) => (
        <div key={provider} onClick={() => onSubmit(provider)}>
          <ThemedProviderIcon type={provider} />
        </div>
      ))}
    </div>
  );
};
