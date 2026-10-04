'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@giveaway/ui-primitives/sheet';
import { Button } from '@giveaway/ui-primitives/button';
import { GiveawaySchema } from '@giveaway/sweepstakes-model/schemas';
import {
  IntegrationsSchema,
  hasFeature
} from '@giveaway/integration-model/schemas';
import { AlertCircleIcon, SendIcon } from 'lucide-react';
import { Separator } from '@giveaway/ui-primitives/separator';
import { AutomatedPostIntegrationStep } from './steps/integration-step';
import { BlueskyContentStep } from './steps/bluesky-content-step';
import { DiscordContentStep } from './steps/discord-content-step';
import { useForm, FormProvider, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { generateSkeetText } from '../util';
import {
  postToBlueskyRequestSchema,
  PostToBlueskyRequestSchema,
  postToDiscordRequestSchema,
  PostToDiscordRequestSchema
} from '../schemas';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AutomatedPostJobType } from '@prisma/client';
import { scheduleAutomatedPostJob } from '../procedures/schedule-automated-post-job';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { toast } from 'sonner';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import { useRouter } from 'next/navigation';

interface PostBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sweepstakes: GiveawaySchema;
  liveUrl: string;
  slug: string;
  integrations: IntegrationsSchema;
  onSave: () => void;
}

type PlatformType = 'BLUESKY' | 'DISCORD' | null;

const PLATFORM_SHEET_TITLE: Record<Exclude<PlatformType, null>, string> = {
  BLUESKY: 'Create Bluesky post',
  DISCORD: 'Create Discord post'
};

interface SheetContentWrapperProps {
  selectedPlatform: PlatformType;
  isLoading: boolean;
  children: React.ReactNode;
}

const SheetContentWrapper: React.FC<SheetContentWrapperProps> = ({
  selectedPlatform,
  isLoading,
  children
}) => {
  const getSheetTitle = () => {
    if (!selectedPlatform) return 'Create automated post';
    return PLATFORM_SHEET_TITLE[selectedPlatform];
  };

  return (
    <>
      <SheetHeader className="pb-4 pt-6 px-6">
        <SheetTitle className="text-lg">{getSheetTitle()}</SheetTitle>
        <SheetDescription>
          This post will be published after your giveaway goes live.
        </SheetDescription>
      </SheetHeader>
      <Separator />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4">{children}</div>
      </div>

      {selectedPlatform && (
        <SheetFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Scheduling...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Schedule Post
              </>
            )}
          </Button>
        </SheetFooter>
      )}
    </>
  );
};

interface BlueskyFormProps {
  integrations: IntegrationsSchema;
  sweepstakes: GiveawaySchema;
  liveUrl: string;
  slug: string;
  onSuccess: () => void;
}

const BlueskyForm: React.FC<BlueskyFormProps> = ({
  integrations,
  sweepstakes,
  liveUrl,
  slug,
  onSuccess
}) => {
  const router = useRouter();

  const blueskyIntegrations = integrations.filter(
    (i) => i.provider === 'BLUESKY' && i.status === 'ACTIVE'
  );
  const validBlueskyIntegrations = blueskyIntegrations.filter((i) =>
    hasFeature({ ...i, provider: 'BLUESKY' }, 'FULL_ACCESS')
  );

  const isSweepstakesLive = sweepstakes.status === 'RUNNING';

  const blueskyDefaultValues: PostToBlueskyRequestSchema = {
    imageUrl: undefined,
    text: generateSkeetText({ sweepstakes, liveUrl }),
    integrationId: validBlueskyIntegrations[0]?.id ?? '',
    tasks: ['REPOST', 'LIKE']
  };

  const schedule = useProcedure({
    action: scheduleAutomatedPostJob,
    onSuccess: () => {
      toast.success('Bluesky post scheduled successfully');
      router.refresh();
      onSuccess();
    }
  });

  const form = useForm<PostToBlueskyRequestSchema>({
    resolver: zodResolver(postToBlueskyRequestSchema),
    defaultValues: blueskyDefaultValues,
    mode: 'onChange'
  });

  const handleSubmit = (request: PostToBlueskyRequestSchema) => {
    schedule.run({
      sweepstakesId: sweepstakes.id,
      type: AutomatedPostJobType.POST_TO_BLUESKY,
      request
    });
  };

  const handleSubmitInvalid = (
    errors: FieldErrors<PostToBlueskyRequestSchema>
  ) => {
    console.warn('Form submission errors:', errors);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleSubmitInvalid)}
        className="flex flex-col h-full"
      >
        <SheetContentWrapper
          selectedPlatform="BLUESKY"
          isLoading={schedule.isLoading}
        >
          {isSweepstakesLive && (
            <div className="px-4">
              <Alert variant="warning">
                <AlertCircleIcon />
                <AlertTitle>Your giveaway is live</AlertTitle>
                <AlertDescription>
                  This post will be published immediately upon saving.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <BlueskyContentStep
            integrations={validBlueskyIntegrations}
            isSubmitting={schedule.isLoading}
            hasBlueskyIntegration={blueskyIntegrations.length > 0}
            hasPostingPermission={validBlueskyIntegrations.length > 0}
            slug={slug}
          />
        </SheetContentWrapper>
      </form>
    </FormProvider>
  );
};

interface DiscordFormProps {
  integrations: IntegrationsSchema;
  sweepstakes: GiveawaySchema;
  liveUrl: string;
  slug: string;
  onSuccess: () => void;
}

const DiscordForm: React.FC<DiscordFormProps> = ({
  integrations,
  sweepstakes,
  liveUrl,
  slug,
  onSuccess
}) => {
  const router = useRouter();

  const discordIntegrations = integrations.filter(
    (i) => i.provider === 'DISCORD' && i.status === 'ACTIVE'
  );

  const isSweepstakesLive = sweepstakes.status === 'RUNNING';

  const discordDefaultValues: PostToDiscordRequestSchema = {
    channelId: '',
    integrationId: discordIntegrations[0]?.id ?? '',
    roles: [],
    tasks: []
  };

  const schedule = useProcedure({
    action: scheduleAutomatedPostJob,
    onSuccess: () => {
      toast.success('Discord post scheduled successfully');
      router.refresh();
      onSuccess();
    }
  });

  const form = useForm<PostToDiscordRequestSchema>({
    resolver: zodResolver(postToDiscordRequestSchema),
    defaultValues: discordDefaultValues,
    mode: 'onChange'
  });

  const handleSubmit = (request: PostToDiscordRequestSchema) => {
    schedule.run({
      sweepstakesId: sweepstakes.id,
      type: AutomatedPostJobType.POST_TO_DISCORD,
      request
    });
  };

  const handleSubmitInvalid = (
    errors: FieldErrors<PostToDiscordRequestSchema>
  ) => {
    console.warn('Form submission errors:', errors);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleSubmitInvalid)}
        className="flex flex-col h-full"
      >
        <SheetContentWrapper
          selectedPlatform="DISCORD"
          isLoading={schedule.isLoading}
        >
          {isSweepstakesLive && (
            <div className="px-4">
              <Alert variant="warning">
                <AlertCircleIcon />
                <AlertTitle>Your giveaway is live</AlertTitle>
                <AlertDescription>
                  This post will be published immediately upon saving.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DiscordContentStep
            integrations={discordIntegrations}
            isSubmitting={schedule.isLoading}
            hasDiscordIntegration={discordIntegrations.length > 0}
            slug={slug}
          />
        </SheetContentWrapper>
      </form>
    </FormProvider>
  );
};

export function PostBuilderSheet({
  open,
  onOpenChange,
  integrations,
  sweepstakes,
  liveUrl,
  slug,
  onSave
}: PostBuilderSheetProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(null);

  useEffect(() => {
    if (!open) {
      setSelectedPlatform(null);
    }
  }, [open]);

  const isSweepstakesLive = sweepstakes.status === 'RUNNING';

  const handleSelectPlatform = (platform: PlatformType) => {
    setSelectedPlatform(platform);
  };

  const handleSuccess = () => {
    onSave();
    onOpenChange(false);
  };

  const renderForm = () => {
    if (selectedPlatform === 'BLUESKY') {
      return (
        <BlueskyForm
          integrations={integrations}
          sweepstakes={sweepstakes}
          liveUrl={liveUrl}
          slug={slug}
          onSuccess={handleSuccess}
        />
      );
    }

    if (selectedPlatform === 'DISCORD') {
      return (
        <DiscordForm
          integrations={integrations}
          sweepstakes={sweepstakes}
          liveUrl={liveUrl}
          slug={slug}
          onSuccess={handleSuccess}
        />
      );
    }

    return (
      <SheetContentWrapper
        selectedPlatform={selectedPlatform}
        isLoading={false}
      >
        <AutomatedPostIntegrationStep
          isSweepstakesLive={isSweepstakesLive}
          onSelectBluesky={() => handleSelectPlatform('BLUESKY')}
          onSelectDiscord={() => handleSelectPlatform('DISCORD')}
        />
      </SheetContentWrapper>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-hidden flex flex-col space-y-0 gap-0 p-0"
      >
        {renderForm()}
      </SheetContent>
    </Sheet>
  );
}
