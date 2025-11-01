'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Trophy,
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';
import { PickerWinnerCard } from './picker-winner-card';
import { PickerDrawHistorySheet } from './picker-draw-history-sheet';
import Link from 'next/link';

interface Winner {
  id: string;
  drawId: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  position: number;
  selectedAt: Date;
}

interface Draw {
  id: string;
  pickerId: string;
  drawNumber: number;
  drawnAt: Date;
  numberOfWinners: number;
  eligibleEntries: number;
  verificationHash: string;
  winners: Winner[];
}

interface PickerWinnerSectionProps {
  pickerId: string;
  pickerName: string;
  status: string;
  numberOfWinners: number;
  draws?: Draw[];
  stats?: {
    validEntries: number;
  };
}

export const PickerWinnerSection: React.FC<PickerWinnerSectionProps> = ({
  pickerId,
  pickerName,
  status,
  numberOfWinners,
  draws = [],
  stats
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const latestDraw = draws.length > 0 ? draws[draws.length - 1] : null;
  const hasWinners = latestDraw && latestDraw.winners.length > 0;
  const isProcessed = status === 'PROCESSED';
  const isComplete = status === 'COMPLETE';
  const isPending = status === 'PENDING' || status === 'DRAFT';
  const isProcessing = status === 'PROCESSING';

  const handleClosePicker = async () => {
    setIsClosing(true);
    console.log('Closing picker:', pickerId);
    setIsClosing(false);
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

  if (isComplete) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Picker Closed</CardTitle>
            </div>
            {draws.length > 0 && <PickerDrawHistorySheet draws={draws} />}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This picker has been marked as complete. No further draws can be
            made.
          </p>
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
            <Link href={`/app/${pickerId}/draw`}>
              <Sparkles className="h-4 w-4 mr-2" />
              Draw Winners
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasWinners && latestDraw) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Winners Selected</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Draw #{latestDraw.drawNumber} • {latestDraw.winners.length}{' '}
                  winner{latestDraw.winners.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {draws.length > 1 && <PickerDrawHistorySheet draws={draws} />}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClosePicker}
                disabled={isClosing}
              >
                <Lock className="h-4 w-4 mr-2" />
                Close Picker
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestDraw.winners.map((winner) => (
              <PickerWinnerCard
                key={winner.id}
                winner={winner}
                drawId={latestDraw.id}
                pickerId={pickerId}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>
                Drawn from {latestDraw.eligibleEntries} eligible entries
              </span>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href={`/app/${pickerId}/draw`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View Draw Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
