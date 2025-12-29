import { useArrayContext } from '@/components/hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { extractUsernameFromTweetUrl } from '@/lib/integrations/schemas/twitter';
import { hasFeature, type IntegrationSchema } from '@/lib/integrations/schemas';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useState } from 'react';

import { useFormContext, useWatch } from 'react-hook-form';

// Helper function to filter Twitter integrations with import tasks feature
function getTwitterIntegrationsWithImportTasks(
  integrations: IntegrationSchema[] | undefined
): IntegrationSchema[] {
  return (
    integrations?.filter((i) => {
      if (i.provider !== 'TWITTER' || i.status !== 'ACTIVE') return false;
      return hasFeature(
        i as typeof i & { provider: 'TWITTER' },
        'IMPORT_TASKS'
      );
    }) || []
  );
}

// Helper function to filter Bluesky integrations with full access feature
function getBlueskyIntegrationsWithFullAccess(
  integrations: IntegrationSchema[] | undefined
): IntegrationSchema[] {
  return (
    integrations?.filter((i) => {
      if (i.provider !== 'BLUESKY' || i.status !== 'ACTIVE') return false;
      return hasFeature(i as typeof i & { provider: 'BLUESKY' }, 'FULL_ACCESS');
    }) || []
  );
}

// Helper function to check if there are Twitter integrations without import tasks permission
function hasTwitterWithoutImportTasks(
  integrations: IntegrationSchema[] | undefined
): boolean {
  return (
    integrations?.some((i) => {
      if (i.provider !== 'TWITTER' || i.status !== 'ACTIVE') return false;
      return !hasFeature({ ...i, provider: 'TWITTER' }, 'IMPORT_TASKS');
    }) || false
  );
}

// Helper function to check if there are Bluesky integrations without full access permission
function hasBlueskyWithoutFullAccess(
  integrations: IntegrationSchema[] | undefined
): boolean {
  return (
    integrations?.some((i) => {
      if (i.provider !== 'BLUESKY' || i.status !== 'ACTIVE') return false;
      return !hasFeature({ ...i, provider: 'BLUESKY' }, 'FULL_ACCESS');
    }) || false
  );
}

export const ImportingAccountField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();

  const slug = params.slug as string;
  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const taskType = useWatch({
    control: form.control,
    name: `tasks.${index}.type`
  });

  const isBluesky =
    taskType === 'BLUESKY_LIKE_IMPORT' || taskType === 'BLUESKY_REPOST_IMPORT';
  const providerName = isBluesky ? 'Bluesky' : 'X';
  const Icon = isBluesky ? SocialBlueskyIcon : SocialXIcon;

  const platformIntegrations = isBluesky
    ? getBlueskyIntegrationsWithFullAccess(integrations)
    : getTwitterIntegrationsWithImportTasks(integrations);

  const hasPlatformButNoPermission = isBluesky
    ? hasBlueskyWithoutFullAccess(integrations)
    : hasTwitterWithoutImportTasks(integrations);

  return (
    <>
      <FormField
        control={form.control}
        name={`tasks.${index}.importingAccount`}
        render={({ field }) => (
          <FormItem>
            <SwitchFormHeader
              className="mb-1"
              label="Integration"
              help={{
                title: 'Help: Integration',
                content: (
                  <p>
                    Specify the {providerName} account that will be used to
                    import entries. This account must own the post being
                    validated.
                  </p>
                )
              }}
            />
            {platformIntegrations.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    {hasPlatformButNoPermission
                      ? `Your ${providerName} integration doesn't have import permissions. Please add the "Import Tasks" permission.`
                      : `No ${providerName} integrations found. You need to connect a ${providerName} account to use import tasks.`}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href={`/app/${slug}/settings/integrations`}>
                      <Icon className="h-4 w-4 mr-2" />
                      {hasPlatformButNoPermission
                        ? 'Add Permissions'
                        : `Connect ${providerName}`}
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your account" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformIntegrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {integration.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
          </FormItem>
        )}
      />
    </>
  );
};

export const ImportingTweetIdValidation = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const router = useRouter();
  const params = useParams();

  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const [loading, setLoading] = useState(false);
  const [hasOpenedIntegrations, setHasOpenedIntegrations] = useState(false);

  const slug = params.slug as string;

  const importingAccount = useWatch({
    control: form.control,
    name: `tasks.${index}.importingAccount`
  });

  const tweetId = useWatch({
    control: form.control,
    name: `tasks.${index}.tweetId`
  });

  const twitterIntegrations =
    getTwitterIntegrationsWithImportTasks(integrations);

  const twitterIntegration = twitterIntegrations.find(
    (i) => i.id === importingAccount
  );

  const tweetOwner =
    typeof tweetId === 'string' ? extractUsernameFromTweetUrl(tweetId) : null;
  const connectedUsername = twitterIntegration?.label ?? 'UNKNOWN';

  const isOwnershipValid =
    tweetOwner && connectedUsername && tweetOwner === connectedUsername;
  const hasOwnershipMismatch =
    tweetOwner && connectedUsername && tweetOwner !== connectedUsername;

  const integrationsUrl = `/app/${slug}/settings/integrations`;
  const handleAddIntegration = () => {
    setHasOpenedIntegrations(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    router.refresh();
    setLoading(false);
  };

  if (!importingAccount || !tweetId) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {twitterIntegrations.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <p>
              No Twitter integration found. You need to connect a Twitter
              account to use validation.
            </p>
            {!hasOpenedIntegrations ? (
              <Button variant="outline" size="sm" className="w-fit" asChild>
                <Link
                  href={integrationsUrl}
                  onClick={handleAddIntegration}
                  target="_blank"
                >
                  <SocialXIcon className="h-4 w-4 mr-2" />
                  Add Twitter Integration
                </Link>
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  After connecting your Twitter account in the new tab, click
                  refresh to update.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Integration
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : hasOwnershipMismatch ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Tweet ownership mismatch</p>
            <p className="text-sm mt-1">
              This tweet is owned by @{tweetOwner}, but your connected Twitter
              account is @{connectedUsername}. Validation will not work for
              tweets you don't own.
            </p>
          </AlertDescription>
        </Alert>
      ) : isOwnershipValid ? (
        <Alert variant="success">
          <Info className="h-4 w-4" />
          <AlertDescription className="font-normal">
            <span>
              Tweet ownership verified. Connected account:{' '}
              <Link
                className="font-semibold underline inline-flex"
                href={integrationsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{connectedUsername}
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
