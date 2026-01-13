'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { GiveawaySchema } from '@/schemas/giveaway/schemas';
import { IntegrationsSchema, hasFeature } from '@/lib/integrations/schemas';
import { AlertCircleIcon, SendIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AutomatedPostIntegrationStep } from './steps/integration-step';
import { TwitterContentStep } from './steps/twitter-content-step';
import { BlueskyContentStep } from './steps/bluesky-content-step';
import { useForm, FormProvider, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { generateTweetText, generateSkeetText } from '../util';
import {
  postToTwitterRequestSchema,
  PostToTwitterRequestSchema,
  postToBlueskyRequestSchema,
  PostToBlueskyRequestSchema
} from '../schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AutomatedPostJobType } from '@prisma/client';
import { scheduleAutomatedPostJob } from '../procedures/schedule-automated-post-job';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
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

type PlatformType = 'TWITTER' | 'BLUESKY' | null;

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
    if (selectedPlatform === 'TWITTER') return 'Create Twitter post';
    if (selectedPlatform === 'BLUESKY') return 'Create Bluesky post';
    return 'Create automated post';
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

interface TwitterFormProps {
  integrations: IntegrationsSchema;
  sweepstakes: GiveawaySchema;
  liveUrl: string;
  slug: string;
  onSuccess: () => void;
}

const TwitterForm: React.FC<TwitterFormProps> = ({
  integrations,
  sweepstakes,
  liveUrl,
  slug,
  onSuccess
}) => {
  const router = useRouter();

  const twitterIntegrations = integrations.filter(
    (i) => i.provider === 'TWITTER' && i.status === 'ACTIVE'
  );
  const validTwitterIntegrations = twitterIntegrations.filter((i) =>
    hasFeature({ ...i, provider: 'TWITTER' }, 'POST_TWEETS')
  );

  const isSweepstakesLive = sweepstakes.status === 'RUNNING';

  const twitterDefaultValues: PostToTwitterRequestSchema = {
    imageUrl: undefined,
    text: generateTweetText({ sweepstakes, liveUrl }),
    integrationId: validTwitterIntegrations[0]?.id ?? '',
    tasks: ['REPOST', 'LIKE']
  };

  const schedule = useProcedure({
    action: scheduleAutomatedPostJob,
    onSuccess: () => {
      toast.success('Twitter post scheduled successfully');
      router.refresh();
      onSuccess();
    }
  });

  const form = useForm<PostToTwitterRequestSchema>({
    resolver: zodResolver(postToTwitterRequestSchema),
    defaultValues: twitterDefaultValues,
    mode: 'onChange'
  });

  const handleSubmit = (request: PostToTwitterRequestSchema) => {
    schedule.run({
      sweepstakesId: sweepstakes.id,
      type: AutomatedPostJobType.POST_TO_TWITTER,
      request
    });
  };

  const handleSubmitInvalid = (
    errors: FieldErrors<PostToTwitterRequestSchema>
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
          selectedPlatform="TWITTER"
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

          <TwitterContentStep
            integrations={validTwitterIntegrations}
            isSubmitting={schedule.isLoading}
            hasTwitterIntegration={twitterIntegrations.length > 0}
            hasPostingPermission={validTwitterIntegrations.length > 0}
            slug={slug}
          />
        </SheetContentWrapper>
      </form>
    </FormProvider>
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
    if (selectedPlatform === 'TWITTER') {
      return (
        <TwitterForm
          integrations={integrations}
          sweepstakes={sweepstakes}
          liveUrl={liveUrl}
          slug={slug}
          onSuccess={handleSuccess}
        />
      );
    }

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

    return (
      <SheetContentWrapper
        selectedPlatform={selectedPlatform}
        isLoading={false}
      >
        <AutomatedPostIntegrationStep
          isSweepstakesLive={isSweepstakesLive}
          onSelectTwitter={() => handleSelectPlatform('TWITTER')}
          onSelectBluesky={() => handleSelectPlatform('BLUESKY')}
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
