import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/patterns/provider-icon';
import { PROVIDER_SCHEMA_LABELS, ProviderSchemaType } from '@/schemas/user';
import React from 'react';

type ProviderButtonsProps = {
  onSubmit: (provider: string) => void;
};

const PROVIDERS: ProviderSchemaType[] = [
  'twitter',
  'google',
  'discord',
  'email'
];

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
  onSubmit
}: ProviderButtonsProps) => {
  const actionText = 'Login';

  return (
    <div className="flex flex-col gap-3 w-full">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          name="provider"
          value={provider}
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
      {PROVIDERS.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          size="icon"
          name="provider"
          value={provider}
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
