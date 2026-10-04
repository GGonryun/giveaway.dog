'use client';

import { Button } from '@giveaway/ui-primitives/button';
import { ProviderIcon } from '@giveaway/integration-icons/provider-icon';
import { CircleAlertIcon, Plus, UnlinkIcon, UnplugIcon } from 'lucide-react';
import { useUser } from '@giveaway/account-context/user-provider';
import { toast } from 'sonner';

import { useProcedure } from '@giveaway/rpc-client/hook';
import disconnectAccount from '@giveaway/account-server/disconnect-account';
import { useRouter } from 'next/navigation';
import {
  ENABLED_IDENTITY_PROVIDERS,
  isMissingScopes,
  PROVIDER_REQUIRED_SCOPES,
  IDENTITY_PROVIDER_LABEL,
  SOCIAL_PROVIDERS
} from '@giveaway/integration-model/providers';
import {
  Alert,
  AlertTitle,
  AlertDescription
} from '@giveaway/ui-primitives/alert';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import login from '@giveaway/auth-actions/login';
import { SettingsCard } from '@giveaway/ui-layouts/settings-card';
import { useState } from 'react';
import { BlueskyConnectForm } from '@giveaway/bluesky-connect-ui/bluesky-connect-form';
import { InstagramConnectForm } from '@giveaway/meta-connect-ui/instagram-connect-form';
import { FacebookConnectForm } from '@giveaway/meta-connect-ui/facebook-connect-form';
import { AccountStatusAlert } from '@giveaway/auth-login-ui/account-status-alert';

export const SocialProviders = () => {
  const router = useRouter();
  const user = useUser();
  const [showBlueskyInput, setShowBlueskyInput] = useState(false);
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  const [showFacebookInput, setShowFacebookInput] = useState(false);

  const loginProcedure = useProcedure({
    action: login,
    onFailure: (error) => {
      toast.error(error.message);
    }
  });

  const disconnectAccountProcedure = useProcedure({
    action: disconnectAccount,
    onSuccess: () => {
      toast.success('Account disconnected');
      router.refresh();
    }
  });

  return (
    <SettingsCard
      title="Connected Accounts"
      description="Manage your social media accounts for signing in and completing tasks."
      footer={
        "Connecting additional accounts allows you to sign in with any of them. Even if you use different email addresses, they'll all be linked to this profile."
      }
    >
      <div className="space-y-4">
        {SOCIAL_PROVIDERS.map((providerId, i) => {
          const providerLabel = IDENTITY_PROVIDER_LABEL[providerId];
          const requiredScopes = PROVIDER_REQUIRED_SCOPES[providerId] || [];

          const provider = user.providers.find((p) => p.type === providerId);
          const isMissing = isMissingScopes(provider, requiredScopes);
          const isError = provider?.status === 'ERROR';
          const needsReconnect = isMissing || isError;
          const isConnectingThis = loginProcedure.isLoading;
          const isEnabled = ENABLED_IDENTITY_PROVIDERS[providerId];

          return (
            <div key={i} className="p-2 border rounded-lg space-y-2">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2">
                  <div className="w-12 h-12 bg-background flex items-center justify-center">
                    <ProviderIcon
                      type={providerId}
                      className="w-8 h-8 text-foreground"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{providerLabel}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider
                        ? `${provider.label.toLowerCase()}`
                        : 'Not connected'}
                    </div>
                  </div>
                </div>

                {(providerId === 'BLUESKY' && showBlueskyInput) ||
                (providerId === 'INSTAGRAM' && showInstagramInput) ||
                (providerId === 'FACEBOOK' &&
                  showFacebookInput) ? null : provider ? (
                  <Button
                    variant={needsReconnect ? 'destructive' : 'outline'}
                    size="sm"
                    disabled={isConnectingThis || !isEnabled}
                    onClick={() => {
                      disconnectAccountProcedure.run(provider);
                    }}
                    className="w-full sm:w-[125px]"
                  >
                    {isConnectingThis ? <Spinner size="xs" /> : <UnlinkIcon />}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full sm:w-[125px]"
                    onClick={() => {
                      if (providerId === 'BLUESKY') {
                        setShowBlueskyInput(true);
                      } else if (providerId === 'INSTAGRAM') {
                        setShowInstagramInput(true);
                      } else if (providerId === 'FACEBOOK') {
                        setShowFacebookInput(true);
                      } else {
                        return loginProcedure.run({
                          provider: providerId,
                          redirectTo: '/account',
                          returnTo: '/account',
                          revalidate: 'true'
                        });
                      }
                    }}
                    disabled={isConnectingThis || !isEnabled}
                  >
                    {isConnectingThis ? <Spinner size="xs" /> : <Plus />}
                    Connect
                  </Button>
                )}
              </div>
              {!isEnabled && (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertTitle>Provider Disabled</AlertTitle>
                  <AlertDescription>
                    This provider is currently disabled and cannot be connected.
                  </AlertDescription>
                </Alert>
              )}
              {Boolean(provider && isMissing) && (
                <IsMissingPermissions providerLabel={providerLabel} />
              )}
              {Boolean(provider && isError) && (
                <AccountStatusAlert
                  status="ERROR"
                  providerLabel={providerLabel}
                />
              )}
              {providerId === 'BLUESKY' && showBlueskyInput && (
                <BlueskyConnectForm
                  returnTo="/account"
                  redirectTo="/account"
                  onConnect={() => setShowBlueskyInput(false)}
                  onCancel={() => setShowBlueskyInput(false)}
                />
              )}
              {providerId === 'INSTAGRAM' && showInstagramInput && (
                <InstagramConnectForm
                  returnTo="/account"
                  redirectTo="/account"
                  onConnect={() => setShowInstagramInput(false)}
                  onCancel={() => setShowInstagramInput(false)}
                />
              )}
              {providerId === 'FACEBOOK' && showFacebookInput && (
                <FacebookConnectForm
                  returnTo="/account"
                  redirectTo="/account"
                  onConnect={() => setShowFacebookInput(false)}
                  onCancel={() => setShowFacebookInput(false)}
                />
              )}
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
};

const IsMissingPermissions: React.FC<{
  providerLabel: string;
}> = ({ providerLabel }) => {
  return (
    <Alert variant="primary" className="text-left">
      <CircleAlertIcon className="h-4 w-4" />
      <AlertTitle>Missing Permissions</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        Some {providerLabel} permissions are missing. Please reconnect your
        account to prevent any disruption to your access.
      </AlertDescription>
    </Alert>
  );
};
