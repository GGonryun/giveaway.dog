'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Trophy,
  Sparkles,
  Lock,
  ExternalLink,
  Share2
} from 'lucide-react';
import { PickerWinnerCard } from './picker-winner-card';
import Link from 'next/link';
import { PickerDrawSchema } from '../schemas/draws';
import { useProcedure } from '@/lib/mrpc/hook';
import { completePicker } from '../procedures/complete-picker';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PickerDrawResult } from '@prisma/client';

interface PickerWinnerSectionProps {
  pickerId: string;
  pickerName: string;
  status: string;
  numberOfWinners: number;
  teamSlug: string;
  postUrl: string;
  draws?: PickerDrawSchema[];
  stats?: {
    validEntries: number;
  };
}

export const PickerWinnerSection: React.FC<PickerWinnerSectionProps> = ({
  pickerId,
  pickerName,
  status,
  numberOfWinners,
  teamSlug,
  postUrl,
  draws = [],
  stats
}) => {
  const router = useRouter();

  const completeProcedure = useProcedure({
    action: completePicker,
    onSuccess() {
      toast.success(
        'Picker marked as complete! No further changes can be made.'
      );
      router.refresh();
    },
    onFailure(error) {
      toast.error(
        error.message || 'Failed to complete picker. Please try again.'
      );
    }
  });

  const hasWinners = draws.length > 0;
  const isProcessed = status === 'PROCESSED';
  const isComplete = status === 'COMPLETE';
  const isPending = status === 'PENDING' || status === 'DRAFT';
  const isProcessing = status === 'PROCESSING';

  const handleClosePicker = () => {
    completeProcedure.run({ pickerId });
  };

  if (isPending) {
    return (
      <Alert className="border-muted-foreground/20 bg-muted/30">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <AlertDescription>
          <p className="font-semibold text-foreground mb-1">Sync Required</p>
          <p className="text-sm text-muted-foreground">
            Winners can be picked after entries and users have been imported.
            Visit the Participants tab to start syncing data from X.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isProcessing) {
    return (
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <AlertDescription>
          <p className="font-semibold text-blue-500 mb-1">Processing Entries</p>
          <p className="text-sm text-muted-foreground">
            We're currently processing entries and applying your filters. This
            may take a few minutes depending on the number of participants.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasWinners) {
    const currentWinners = draws.filter(
      (draw) => draw.result === PickerDrawResult.WINNER
    );
    const latestDraw =
      currentWinners[currentWinners.length - 1] || draws[draws.length - 1];

    return (
      <Card
        className={
          isComplete ? 'border-2 border-muted' : 'border-2 border-primary/20'
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isComplete ? 'bg-muted' : 'bg-primary/10'}`}
              >
                {isComplete ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Trophy className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle>
                  {isComplete ? 'Picker Closed' : 'Winners Selected'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentWinners.length} winner
                  {currentWinners.length > 1 ? 's' : ''} selected
                  {isComplete && ' (Picker Complete)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClosePicker}
                  disabled={completeProcedure.isLoading}
                >
                  {completeProcedure.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentWinners.map((draw) => (
              <PickerWinnerCard
                key={draw.drawId}
                postUrl={postUrl}
                winner={draw.winner}
                pickerId={pickerId}
              />
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>
                Drawn from {latestDraw.eligibleEntries} eligible entries
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Button variant="link" size="sm" asChild>
                <Link href={`/app/${teamSlug}/pickers/${pickerId}/draw`}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Draw Details
                </Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link
                  href={`/draws/${pickerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share Results
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isProcessed && !hasWinners) {
    return (
      <Alert className="border-primary/50 bg-primary/5">
        <Trophy className="h-5 w-5 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary mb-1">
              Ready to Pick Winners!
            </p>
            <p className="text-sm">
              {pickerName} has finished processing. You can now draw{' '}
              {numberOfWinners} winner{numberOfWinners > 1 ? 's' : ''} from{' '}
              {stats?.validEntries || 0} valid entries.
            </p>
          </div>
          <Button asChild>
            <Link href={`/app/${teamSlug}/pickers/${pickerId}/draw`}>
              <Sparkles className="h-4 w-4 mr-2" />
              Draw Winners
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
