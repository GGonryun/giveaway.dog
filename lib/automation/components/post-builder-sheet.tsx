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
import { AutomatedPostContentStep } from './steps/content-step';
import { useForm, FormProvider, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { generateTweetText } from '../util';
import {
  postToTwitterRequestSchema,
  PostToTwitterRequestSchema
} from '../schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AutomatedPostJobType } from '@prisma/client';
import { scheduleAutomatedPostJob } from '../procedures/schedule-automated-post-job';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';

interface TwitterPostBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sweepstakes: GiveawaySchema;
  liveUrl: string;
  slug: string;
  integrations: IntegrationsSchema;
  onSave: () => void;
}

export function PostBuilderSheet({
  open,
  onOpenChange,
  integrations,
  sweepstakes,
  liveUrl,
  slug,
  onSave
}: TwitterPostBuilderSheetProps) {
  const router = useRouter();
  // Filter valid Twitter integrations with posting permissions
  const twitterIntegrations = integrations.filter(
    (i) => i.provider === 'TWITTER' && i.status === 'ACTIVE'
  );
  const validIntegrations = twitterIntegrations.filter((i) =>
    hasFeature(i, 'POST_TWEETS')
  );

  const defaultValues: PostToTwitterRequestSchema = {
    imageUrl: undefined,
    text: generateTweetText({ sweepstakes, liveUrl }),
    integrationId: validIntegrations[0]?.id ?? '',
    tasks: ['REPOST', 'LIKE']
  };

  const schedule = useProcedure({
    action: scheduleAutomatedPostJob,
    onSuccess: () => {
      toast.success('Twitter post scheduled successfully');
      router.refresh();
      onSave();
    }
  });

  // Initialize form with postToTwitterJobDataSchema structure
  const form = useForm<PostToTwitterRequestSchema>({
    resolver: zodResolver(postToTwitterRequestSchema),
    defaultValues,
    mode: 'onChange'
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Do we need this?
  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      setCurrentStep(1);
    }
  }, [open]);

  // Check if sweepstakes is already live (RUNNING status)
  const isSweepstakesLive = sweepstakes.status === 'RUNNING';

  const handleSubmitValid = (request: PostToTwitterRequestSchema) => {
    console.log('Submitting request:', request);
    schedule.run({
      sweepstakesId: sweepstakes.id,
      type: AutomatedPostJobType.POST_TO_TWITTER,
      request
    });
  };

  const handleSubmitInvalid = (
    errors: FieldErrors<PostToTwitterRequestSchema>
  ) => {
    console.log('Form submission errors:', errors);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-hidden flex flex-col space-y-0 gap-0 p-0"
      >
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmitValid, handleSubmitInvalid)}
            className="flex flex-col h-full"
          >
            <SheetHeader className="pb-4 pt-6 px-6">
              <SheetTitle className="text-lg">Create automated post</SheetTitle>
              <SheetDescription>
                This post will be published after your giveaway goes live.
              </SheetDescription>
            </SheetHeader>
            <Separator />

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pb-4">
                {currentStep !== 1 && (
                  <div className="px-4">
                    {isSweepstakesLive && (
                      <Alert variant="warning">
                        <AlertCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <AlertTitle>Your giveaway is live</AlertTitle>
                        <AlertDescription>
                          This post will be published immediately upon saving.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <AutomatedPostIntegrationStep
                    hasTwitterIntegration={twitterIntegrations.length > 0}
                    hasPostingPermission={validIntegrations.length > 0}
                    slug={slug}
                    isSweepstakesLive={isSweepstakesLive}
                    onNext={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <AutomatedPostContentStep
                    integrations={validIntegrations}
                    isSubmitting={schedule.isLoading}
                  />
                )}
              </div>
            </div>

            {currentStep === 2 && (
              <SheetFooter className="border-t px-6 py-4">
                <Button
                  type="submit"
                  disabled={schedule.isLoading}
                  className="w-full"
                >
                  {schedule.isLoading ? (
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
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
