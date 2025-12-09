import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/lib/integrations/components/icons/provider-icon';
import {
  ProviderTypeSchema,
  PROVIDER_SCHEMA_LABELS,
  ENABLED_AUTH_PROVIDERS,
  LOGIN_PROVIDERS
} from '@/lib/integrations/schemas/providers';
import React from 'react';

type ProviderButtonsProps = {
  onSubmit: (provider: string) => void;
};

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
  onSubmit
}: ProviderButtonsProps) => {
  const actionText = 'Login';

  return (
    <div className="flex flex-col gap-3 w-full">
      {LOGIN_PROVIDERS.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          name="provider"
          value={provider}
          disabled={!ENABLED_AUTH_PROVIDERS[provider]}
          formNoValidate
          className="w-full justify-start"
          onClick={() => onSubmit(provider)}
        >
          <ProviderIcon type={provider} className="mr-2 h-4 w-4" />
          {actionText} with {PROVIDER_SCHEMA_LABELS[provider]}
        </Button>
      ))}
    </div>
  );
};

export const ProviderIcons: React.FC<ProviderButtonsProps> = ({ onSubmit }) => {
  return (
    <div className="flex flex-row gap-2 w-full">
      {LOGIN_PROVIDERS.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          size="icon"
          name="provider"
          value={provider}
          disabled={!ENABLED_AUTH_PROVIDERS[provider]}
          formNoValidate
          aria-label={`Login with ${PROVIDER_SCHEMA_LABELS[provider]}`}
          onClick={() => onSubmit(provider)}
        >
          <ProviderIcon type={provider} />
        </Button>
      ))}
    </div>
  );
};
