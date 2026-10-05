import { Badge } from '@giveaway/ui-primitives/badge';
import { Button } from '@giveaway/ui-primitives/button';
import {
  PROVIDER_THEME,
  ProviderIcon,
  ThemedProviderIcon
} from '@giveaway/integration-icons/provider-icon';
import {
  IDENTITY_PROVIDER_LABEL,
  ENABLED_IDENTITY_PROVIDERS,
  ProviderSchema
} from '@giveaway/integration-model/providers';
import { cn } from '@giveaway/ui-utils/utils';
import { IdentityProvider } from '@giveaway/db-model';
import React from 'react';

type ProviderButtonsProps = {
  identities: IdentityProvider[];
  onSubmit: (provider: IdentityProvider) => void;
  userProviders?: ProviderSchema[];
  lastUsedProvider?: IdentityProvider;
};

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit,
  userProviders,
  lastUsedProvider
}: ProviderButtonsProps) => (
  <div className="flex flex-col gap-2 w-full">
    {identities.map((provider) => {
      const account = userProviders?.find((p) => p.type === provider);
      const isError = account?.status === 'ERROR';

      return (
        <div key={provider} className="space-y-2">
          <Button
            variant={isError ? 'destructive' : 'outline'}
            name="provider"
            value={provider}
            disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
            formNoValidate
            className="w-full justify-center items-center relative"
            onClick={() => onSubmit(provider)}
          >
            <ProviderIcon type={provider} className="absolute left-4 h-4 w-4" />
            <span>
              {isError ? 'Reconnect' : 'Login with'}{' '}
              {IDENTITY_PROVIDER_LABEL[provider]}
            </span>
            {provider === lastUsedProvider && (
              <Badge
                variant="info"
                className="absolute -top-2 -right-2 text-xs "
              >
                Last used
              </Badge>
            )}
          </Button>
        </div>
      );
    })}
  </div>
);

export const ProviderIcons: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit,
  userProviders
}) => {
  return (
    <div className="flex flex-row gap-2 w-full items-center justify-center">
      {identities.map((provider) => {
        const account = userProviders?.find((p) => p.type === provider);
        const isError = account?.status === 'ERROR';

        return (
          <Button
            key={provider}
            variant={isError ? 'destructive' : 'outline'}
            size="icon"
            name="provider"
            value={provider}
            disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
            formNoValidate
            aria-label={`${isError ? 'Reconnect' : 'Login with'} ${IDENTITY_PROVIDER_LABEL[provider]}`}
            onClick={() => onSubmit(provider)}
          >
            <ProviderIcon type={provider} />
          </Button>
        );
      })}
    </div>
  );
};

export const ProviderDots: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit,
  userProviders
}) => {
  return (
    <div className="flex flex-wrap flex-row gap-1 w-full items-center justify-center">
      {identities.map((provider) => {
        const account = userProviders?.find((p) => p.type === provider);
        const isError = account?.status === 'ERROR';

        return (
          <div
            key={provider}
            onClick={() => onSubmit(provider)}
            className={cn(isError && 'opacity-50')}
          >
            <ThemedProviderIcon type={provider} />
          </div>
        );
      })}
    </div>
  );
};

export const ProviderPills: React.FC<ProviderButtonsProps> = ({
  identities,
  onSubmit,
  userProviders
}) => {
  return (
    <div className="flex flex-col gap-3">
      {identities.map((provider) => {
        const account = userProviders?.find((p) => p.type === provider);
        const isError = account?.status === 'ERROR';
        const theme = PROVIDER_THEME[provider];

        return (
          <div key={provider} className="space-y-2">
            <Button
              variant={isError ? 'destructive' : 'outline'}
              name="provider"
              value={provider}
              disabled={!ENABLED_IDENTITY_PROVIDERS[provider]}
              formNoValidate
              className={cn(
                !isError && theme.bgColor,
                !isError && theme.fillColor,
                !isError && theme.textColor,
                !isError && `hover:${theme.bgColor}/80`,
                !isError && `hover:${theme.textColor}/80`,
                !isError && `group-hover:${theme.bgColor}/80`,
                !isError && `group-hover:${theme.textColor}/80`,
                !isError && `focus:${theme.bgColor}/80`,
                !isError && `focus:${theme.textColor}/80`,
                !isError && `dark:hover:${theme.bgColor}/80`,
                !isError && `dark:hover:${theme.textColor}/80`,
                !isError && `dark:focus:${theme.bgColor}/80`,
                !isError && `dark:focus:${theme.textColor}/80`,
                !isError && `dark:group-hover:${theme.bgColor}/80`,
                !isError && `dark:group-hover:${theme.textColor}/80`
              )}
              onClick={() => onSubmit(provider)}
            >
              <ProviderIcon type={provider} />
              <span>
                {isError ? 'Reconnect' : 'Login with'}{' '}
                {IDENTITY_PROVIDER_LABEL[provider]}
              </span>
            </Button>
          </div>
        );
      })}
    </div>
  );
};
