'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ParticipantSweepstakeSchema } from '@giveaway/sweepstakes-model/schemas';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import { PostBuilderSheet } from './post-builder-sheet';
import { AutomatedPostDetails } from './automated-post-details';
import { AutomatedPostJobSchema } from '../schemas';

import { useLiveSweepstakesUrl } from '@/components/sweepstakes/use-live-sweepstakes-url';
type AutomationCardProps = ParticipantSweepstakeSchema & {
  integrations: IntegrationsSchema;
  slug: string;
  jobs: AutomatedPostJobSchema[];
};

export function AutomationCard({
  sweepstakes,
  integrations,
  slug,
  jobs
}: AutomationCardProps) {
  const liveUrl = useLiveSweepstakesUrl(sweepstakes);

  const [isTwitterBuilderOpen, setIsTwitterBuilderOpen] = useState(false);

  const hasSweepstakesEnded = sweepstakes.status === 'EXPIRED';

  const handleAddAutomation = () => {
    if (hasSweepstakesEnded) {
      toast.error('The sweepstakes has ended');
      return;
    }
    setIsTwitterBuilderOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation</CardTitle>
              <CardDescription>
                Schedule automated posts for your sweepstake
              </CardDescription>
            </div>

            <Button
              disabled={hasSweepstakesEnded}
              size="sm"
              onClick={handleAddAutomation}
            >
              <Plus />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!jobs.length ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Click "Add" to schedule your first automation.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {jobs.map((job) => (
                <AutomatedPostDetails key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PostBuilderSheet
        open={isTwitterBuilderOpen}
        onOpenChange={setIsTwitterBuilderOpen}
        sweepstakes={sweepstakes}
        liveUrl={liveUrl}
        slug={slug}
        integrations={integrations}
        onSave={() => {
          setIsTwitterBuilderOpen(false);
        }}
      />
    </>
  );
}
