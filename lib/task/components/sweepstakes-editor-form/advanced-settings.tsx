'use client';

import { useArrayContext } from '@/components/hooks/use-array-context';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Typography } from '@/components/ui/typography';
import { assertNever } from '@/lib/errors';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useCallback, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { TaskType } from '@prisma/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { extractUsernameFromTweetUrl } from '@/lib/integrations/schemas/twitter';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import Link from 'next/link';
import { featureFlags } from '@/lib/feature-flags';
import { EXPERIMENTAL_VALIDATION_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';

export const AdvancedSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'VISIT_URL':
      case 'BONUS_TASK':
      case 'TWITTER_CONNECT':
      case 'TWITTER_FOLLOW':
      case 'STEAM_WISHLIST':
      case 'DISCORD_JOIN':
      case 'TWITCH_FOLLOW':
      case 'KICK_FOLLOW':
      case 'SECRET_CODE':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      case 'TWITTER_RETWEET':
        return (
          <>
            <ValidateEntriesField />
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      default:
        throw assertNever(type);
    }
  }, []);

  return (
    <div className="space-y-1 pt-2">
      <AdvancedLabel />
      <div className="space-y-2">{content()}</div>
    </div>
  );
};

const AdvancedLabel: React.FC = () => {
  return <Typography.Paragraph weight="medium">Advanced</Typography.Paragraph>;
};

const MandatoryField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.mandatory`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Mandatory"
              description="Users must complete this task to access non-mandatory tasks"
              help={{
                title: 'Help: Mandatory Tasks',
                content: (
                  <p>
                    Mandatory tasks can be used to gate access to other tasks.
                    These should usually be tasks that are required for the
                    giveaway, such as following on social media or subscribing
                    to a newsletter.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

const TasksRequiredField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.tasksRequired`}
        render={({ field }) => (
          <FormItem className="grid grid-cols-[1fr_80px] gap-2 items-center">
            <SwitchFormHeader
              label="Tasks Required"
              description="Locked until this many other tasks are completed"
              help={{
                title: 'Help: Tasks Required',
                content: (
                  <p>
                    Task requirements can be used to lock this task until a
                    certain number of other tasks are completed.
                  </p>
                )
              }}
            />
            <FormControl>
              <Input
                type="number"
                value={String(field.value ?? 0)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value) || value < 0) {
                    field.onChange(0);
                  } else {
                    field.onChange(value);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

const ValidateEntriesField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { teamFeatureFlags, integrations } =
    useUnifiedFormLayout<SweepstakeStep>();

  const [loading, setLoading] = useState(false);
  const [hasOpenedIntegrations, setHasOpenedIntegrations] = useState(false);

  const validateEntries = useWatch({
    control: form.control,
    name: `tasks.${index}.validateEntries`
  });

  const tweetId = useWatch({
    control: form.control,
    name: `tasks.${index}.tweetId`
  });

  const twitterIntegrations =
    integrations?.filter(
      (i) => i.provider === 'TWITTER' && i.status === 'ACTIVE'
    ) || [];

  const twitterIntegration = twitterIntegrations[0];
  const tweetOwner =
    typeof tweetId === 'string' ? extractUsernameFromTweetUrl(tweetId) : null;
  const connectedUsername = twitterIntegration?.label;
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

  const hasExperimentalValidation = featureFlags.parseTeam(
    teamFeatureFlags,
    EXPERIMENTAL_VALIDATION_FEATURE_FLAG_KEY
  );

  if (!hasExperimentalValidation) {
    return null;
  }

  return (
    <>
      <SwitchBox>
        <FormField
          control={form.control}
          name={`tasks.${index}.validateEntries`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label="Validate Entries"
                description="Automatically import and validate Twitter users who retweet this post"
                help={{
                  title: 'Help: Validate Entries',
                  content: (
                    <p>
                      When enabled, Twitter users who retweet this post will be
                      automatically imported every hour until the sweepstakes
                      draw date. This allows you to verify that winners actually
                      completed the task.
                    </p>
                  )
                }}
              />
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {validateEntries && (
          <div className="space-y-2 mt-2">
            {twitterIntegrations.length === 0 ? (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    No Twitter integration found. You need to connect a Twitter
                    account to use validation.
                  </p>
                  {!hasOpenedIntegrations ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      asChild
                    >
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
                        After connecting your Twitter account in the new tab,
                        click refresh to update.
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
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Tweet ownership mismatch</p>
                  <p className="text-sm mt-1">
                    This tweet is owned by @{tweetOwner}, but your connected
                    Twitter account is @{connectedUsername}. Validation will not
                    work for tweets you don't own.
                  </p>
                </AlertDescription>
              </Alert>
            ) : isOwnershipValid ? (
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-normal">
                  Connected account:{' '}
                  <Link
                    className="font-semibold underline"
                    href={integrationsUrl}
                    target="_blank"
                  >
                    @{connectedUsername}
                  </Link>
                </AlertTitle>
              </Alert>
            ) : null}
          </div>
        )}
      </SwitchBox>
    </>
  );
};
