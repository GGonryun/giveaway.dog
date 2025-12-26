import { Button } from '@/components/ui/button';
import {
  PROVIDER_THEME,
  ProviderIcon,
  ThemedProviderIcon
} from '@/lib/integrations/components/icons/provider-icon';
import {
  IDENTITY_PROVIDER_LABEL,
  ENABLED_IDENTITY_PROVIDERS
} from '@/lib/integrations/schemas/providers';
import { cn } from '@/lib/utils';
import { IdentityProvider } from '@prisma/client';
import React from 'react';

type ProviderButtonsProps = {
  identities: IdentityProvider[];
  onSubmit: (provider: IdentityProvider) => void;
};

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit
}: ProviderButtonsProps) => (
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
        <ProviderIcon type={provider} className="absolute left-4 h-4 w-4" />
        <span>Login with {IDENTITY_PROVIDER_LABEL[provider]}</span>
      </Button>
    ))}
  </div>
);

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

export const ProviderDots: React.FC<ProviderButtonsProps> = ({
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

export const ProviderPills: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit
}) => {
  return (
    <div className="flex flex-col gap-3">
      {identities.map((provider) => {
        const theme = PROVIDER_THEME[provider];
        return (
          <Button
            key={provider}
            variant="outline"
            name="provider"
            value={provider}
            disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
            formNoValidate
            className={cn(
              theme.bgColor,
              theme.fillColor,
              theme.textColor,
              `hover:${theme.bgColor}/80`,
              `hover:${theme.textColor}/80`,
              `group-hover:${theme.bgColor}/80`,
              `group-hover:${theme.textColor}/80`,
              `focus:${theme.bgColor}/80`,
              `focus:${theme.textColor}/80`,
              `dark:hover:${theme.bgColor}/80`,
              `dark:hover:${theme.textColor}/80`,
              `dark:focus:${theme.bgColor}/80`,
              `dark:focus:${theme.textColor}/80`,
              `dark:group-hover:${theme.bgColor}/80`,
              `dark:group-hover:${theme.textColor}/80`
            )}
            onClick={() => onSubmit(provider)}
          >
            <ProviderIcon type={provider} />
            <span>Login with {IDENTITY_PROVIDER_LABEL[provider]}</span>
          </Button>
        );
      })}
    </div>
  );
};
