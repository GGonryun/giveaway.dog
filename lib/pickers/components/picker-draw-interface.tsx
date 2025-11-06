'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy,
  AlertCircle,
  Users,
  Sparkles,
  Loader2,
  Clock,
  RotateCw,
  Lock
} from 'lucide-react';
import { drawPicker } from '../procedures/draw-picker';
import { redrawPicker } from '../procedures/redraw-picker';
import { completePicker } from '../procedures/complete-picker';
import { PickerStatus } from '@prisma/client';
import Link from 'next/link';
import { PickerDrawSchema } from '../schemas/draws';
import { PickerWinnerCard } from './picker-winner-card';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { PickerDrawHistory } from './picker-draw-history';
import { PickerDrawResult } from '@prisma/client';

interface PickerDrawInterfaceProps {
  pickerId: string;
  pickerName: string;
  numberOfWinners: number;
  eligibleEntries: number;
  alreadyDrawn: boolean;
  teamSlug: string;
  status: PickerStatus;
  draws?: PickerDrawSchema[];
}

export const PickerDrawInterface: React.FC<PickerDrawInterfaceProps> = ({
  pickerId,
  pickerName,
  numberOfWinners,
  eligibleEntries,
  alreadyDrawn,
  teamSlug,
  status,
  draws = []
}) => {
  const router = useRouter();
  const [redrawDialogOpen, setRedrawDialogOpen] = useState(false);
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');

  const drawProcedure = useProcedure({
    action: drawPicker,
    onSuccess() {
      toast.success('Winners drawn successfully!');
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to draw winners. Please try again.');
    }
  });

  const redrawProcedure = useProcedure({
    action: redrawPicker,
    onSuccess() {
      toast.success('Winner redrawn successfully!');
      setRedrawDialogOpen(false);
      setSelectedDrawId(null);
      setJustification('');
      router.refresh();
    },
    onFailure(error) {
      toast.error(
        error.message || 'Failed to redraw winner. Please try again.'
      );
    }
  });

  const completeProcedure = useProcedure({
    action: completePicker,
    onSuccess() {
      toast.success(
        'Picker marked as complete! No further changes can be made.'
      );
      router.push(`/app/${teamSlug}/pickers/${pickerId}/overview`);
      router.refresh();
    },
    onFailure(error) {
      toast.error(
        error.message || 'Failed to complete picker. Please try again.'
      );
    }
  });

  const handleDraw = () => {
    console.log('[Draw Interface] handleDraw called with:', {
      pickerId,
      numberOfWinners
    });

    drawProcedure.run({
      pickerId,
      numberOfWinners
    });
  };

  const handleRedrawClick = (drawId: string) => {
    setSelectedDrawId(drawId);
    setJustification('');
    setRedrawDialogOpen(true);
  };

  const handleRedrawSubmit = () => {
    if (!selectedDrawId || !justification.trim()) {
      toast.error('Justification is required for redrawing a winner');
      return;
    }

    redrawProcedure.run({
      pickerId,
      drawId: selectedDrawId,
      justification: justification.trim()
    });
  };

  const handleCompletePicker = () => {
    completeProcedure.run({ pickerId });
  };

  const isProcessed = status === PickerStatus.PROCESSED;
  const isProcessing = status === PickerStatus.PROCESSING;
  const isDraft = status === PickerStatus.DRAFT;
  const isComplete = status === PickerStatus.COMPLETE;

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Processing Entries
          </CardTitle>
          <CardDescription>
            The picker is currently processing entries. Winners can be drawn
            once processing is complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="info">
            <Clock className="h-4 w-4" />
            <AlertTitle>Processing in Progress</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                We're fetching and validating entries from X. This may take a
                few minutes depending on the number of participants.
              </p>
              <div className="pt-2">
                <Button variant="outline" asChild>
                  <Link
                    href={`/app/${teamSlug}/pickers/${pickerId}/participants`}
                  >
                    View Progress
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isDraft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Not Ready to Draw
          </CardTitle>
          <CardDescription>
            This picker needs to sync entries before winners can be drawn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sync Required</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Before drawing winners, you need to sync entries from X. Visit
                the Participants tab to start syncing.
              </p>
              <div className="pt-2">
                <Button asChild>
                  <Link
                    href={`/app/${teamSlug}/pickers/${pickerId}/participants`}
                  >
                    Go to Participants
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (alreadyDrawn && draws.length > 0) {
    const currentWinners = draws.filter(
      (draw) => draw.result === PickerDrawResult.WINNER
    );

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Winners Drawn
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentWinners.length}{' '}
                  {currentWinners.length === 1 ? 'winner has' : 'winners have'}{' '}
                  been selected for {pickerName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isComplete && (
                  <Button
                    variant="default"
                    onClick={handleCompletePicker}
                    disabled={completeProcedure.isLoading}
                  >
                    {completeProcedure.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/app/${teamSlug}/pickers/${pickerId}/overview`)
                  }
                >
                  Back to Overview
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentWinners.map((draw) => (
                <PickerWinnerCard
                  key={draw.drawId}
                  winner={draw.winner}
                  drawId={draw.drawId}
                  pickerId={pickerId}
                  showRedrawButton={!isComplete}
                  onRedraw={() => handleRedrawClick(draw.drawId)}
                />
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Winners were drawn from{' '}
                {draws[0]?.eligibleEntries || eligibleEntries} eligible entries.
                {!isComplete &&
                  ' You can redraw any winner until the picker is marked as complete.'}
                {isComplete &&
                  ' This picker is complete and can no longer be modified.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Announcement</CardTitle>
            <CardDescription>
              Copy and customize this message to announce your winners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm whitespace-pre-wrap font-mono">
                {`🎉 Congratulations to our ${currentWinners.length === 1 ? 'winner' : 'winners'}!\n\n${currentWinners.map((draw, i) => `${i + 1}. @${draw.winner.username || 'winner'}`).join('\n')}\n\nThank you to everyone who participated in "${pickerName}"!`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                const message = `🎉 Congratulations to our ${currentWinners.length === 1 ? 'winner' : 'winners'}!\n\n${currentWinners.map((draw, i) => `${i + 1}. @${draw.winner.username || 'winner'}`).join('\n')}\n\nThank you to everyone who participated in "${pickerName}"!`;
                navigator.clipboard.writeText(message);
              }}
            >
              Copy Message
            </Button>
          </CardContent>
        </Card>

        <PickerDrawHistory draws={draws} />

        <Dialog open={redrawDialogOpen} onOpenChange={setRedrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redraw Winner</DialogTitle>
              <DialogDescription>
                Provide a justification for redrawing this winner. This action
                will be logged in the audit trail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="e.g., Winner did not respond, violated rules, etc."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  disabled={redrawProcedure.isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  This justification will be publicly visible in the audit log.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRedrawDialogOpen(false)}
                disabled={redrawProcedure.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRedrawSubmit}
                disabled={redrawProcedure.isLoading || !justification.trim()}
              >
                {redrawProcedure.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redrawing...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Confirm Redraw
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Draw Winners
          </CardTitle>
          <CardDescription>
            Ready to select {numberOfWinners}{' '}
            {numberOfWinners === 1 ? 'winner' : 'winners'} from {pickerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{eligibleEntries}</div>
                <div className="text-sm text-muted-foreground">
                  Eligible Entries
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{numberOfWinners}</div>
                <div className="text-sm text-muted-foreground">
                  {numberOfWinners === 1 ? 'Winner' : 'Winners'} to Select
                </div>
              </div>
            </div>
          </div>

          {eligibleEntries < numberOfWinners && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Not enough eligible entries to draw {numberOfWinners}{' '}
                {numberOfWinners === 1 ? 'winner' : 'winners'}. You have{' '}
                {eligibleEntries} eligible{' '}
                {eligibleEntries === 1 ? 'entry' : 'entries'}.
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">How It Works</h4>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• Winners are randomly selected from eligible entries</li>
                  <li>• Each draw is cryptographically verifiable</li>
                  <li>• Draw results are permanent and cannot be changed</li>
                  <li>
                    • All draws are logged in the audit trail for transparency
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {!isProcessed && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot Draw Winners</AlertTitle>
              <AlertDescription>
                Winners can only be drawn when the picker status is "Processed".
                Current status: <strong>{status}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleDraw}
              disabled={
                drawProcedure.isLoading ||
                eligibleEntries < numberOfWinners ||
                alreadyDrawn ||
                !isProcessed
              }
              size="lg"
              className="flex-1"
            >
              {drawProcedure.isLoading ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Drawing Winners...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Draw {numberOfWinners}{' '}
                  {numberOfWinners === 1 ? 'Winner' : 'Winners'}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                router.push(`/app/${teamSlug}/pickers/${pickerId}`)
              }
              disabled={drawProcedure.isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Once you draw winners, the results cannot
          be undone. Make sure all your settings are correct before proceeding.
        </AlertDescription>
      </Alert>
    </div>
  );
};
