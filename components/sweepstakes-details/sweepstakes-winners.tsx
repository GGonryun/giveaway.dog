'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Shuffle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SweepstakesPrizeSchema } from '@/schemas/giveaway/schemas';
import { DiceIcon } from './dice-icon';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

import { useRouter } from 'next/navigation';
import pluralize from 'pluralize';
import { useProcedure } from '@/lib/mrpc/hook';
import rollWinners from '@/procedures/sweepstakes/roll-winners';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface WinnerCriteria {
  minQualityScore: number;
  preventDuplicateWinners: boolean;
}

interface GroupedPrize {
  id: string;
  name: string;
  slots: SweepstakesPrizeSchema[];
}

interface SlotBasedWinnerSystemProps {
  prizes: SweepstakesPrizeSchema[];
  participants: SweepstakesParticipantSchema[];
  sweepstakesId: string;
  slug: string;
}

export const SweepstakesWinners = ({
  prizes,
  participants,
  sweepstakesId,
  slug
}: SlotBasedWinnerSystemProps) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [rerollWinnerId, setRerollWinnerId] = useState<string | null>(null);
  const [winnerCriteria, setWinnerCriteria] = useState<WinnerCriteria>({
    minQualityScore: 70,
    preventDuplicateWinners: true
  });
  const [expandedWinners, setExpandedWinners] = useState<Set<string>>(
    new Set()
  );

  const { run: runRollWinners, isLoading: isRolling } = useProcedure({
    action: rollWinners,
    onSuccess: () => {
      router.refresh();
      setShowWinnerDialog(false);
      setRerollWinnerId(null);
    }
  });

  const groupedPrizes: GroupedPrize[] = prizes.reduce((acc, prize) => {
    const existing = acc.find((g) => g.id === prize.id);
    if (existing) {
      existing.slots.push(prize);
    } else {
      acc.push({
        id: prize.id,
        name: prize.name,
        slots: [prize]
      });
    }
    return acc;
  }, [] as GroupedPrize[]);

  const emptySlots = prizes.filter((p) => !p.winner).length;

  const getEligibleParticipants = () => {
    // Get already confirmed winner IDs to prevent duplicates if enabled
    const confirmedWinnerIds = winnerCriteria.preventDuplicateWinners
      ? prizes.filter((s) => s.winner).map((s) => s.winner!.participant.id)
      : [];

    return participants.filter((p) => {
      // Check quality score
      if (p.qualityScore < winnerCriteria.minQualityScore) return false;

      // Check duplicate winners
      if (
        winnerCriteria.preventDuplicateWinners &&
        confirmedWinnerIds.includes(p.id)
      )
        return false;

      return true;
    });
  };

  const handleReroll = (winnerId: string) => {
    setRerollWinnerId(winnerId);
    setShowWinnerDialog(true);
  };

  const handleConfirmSelection = () => {
    runRollWinners({
      sweepstakesId,
      slug,
      minQualityScore: winnerCriteria.minQualityScore,
      preventDuplicateWinners: winnerCriteria.preventDuplicateWinners,
      rerollWinnerId: rerollWinnerId ?? undefined
    });
  };

  const eligibleCount = getEligibleParticipants().length;

  const isRerollMode = rerollWinnerId !== null;

  const allWinnersPicked = emptySlots === 0;
  const hasAnyWinners = prizes.some((p) => p.winner);

  const toggleWinnerDetails = (winnerId: string) => {
    setExpandedWinners((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(winnerId)) {
        newSet.delete(winnerId);
      } else {
        newSet.add(winnerId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Winner Contact Disclaimer */}
      {hasAnyWinners && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Important: Contact Winners
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            GiveawayDog is not responsible for reaching out to winners. You will
            need to contact them yourself using the information provided below.
          </AlertDescription>
        </Alert>
      )}

      {!hasAnyWinners ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
            <Alert className="border-blue-200 bg-blue-50 max-w-2xl">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900">
                Winners Can Only Be Selected After Giveaway Ends
              </AlertTitle>
              <AlertDescription className="text-blue-800">
                Once your giveaway has ended, you will be able to select and
                confirm winners. Until then, this section will remain locked.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center text-center space-y-4 max-w-md">
              <div className="rounded-full bg-muted p-6">
                <Shuffle className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Winners Selected</h3>
                <p className="text-sm text-muted-foreground">
                  {emptySlots} prize {pluralize('slot', emptySlots)}{' '}
                  {pluralize('is', emptySlots)} waiting for winners.
                </p>
              </div>
              <Button size="lg" className="mt-4" disabled>
                <Shuffle className="h-4 w-4 mr-2" />
                Pick Winners
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {emptySlots > 0 && (
            <Card>
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="text-center sm:text-left">
                  <p className="font-medium">
                    {emptySlots} {pluralize('slot', emptySlots)} remaining
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pick more winners to fill all empty slots
                  </p>
                </div>
                <Button
                  onClick={() => setShowWinnerDialog(true)}
                  disabled={isRolling}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {isRolling ? 'Rolling...' : 'Pick Remaining'}
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedPrizes.map((group) => (
              <Card key={group.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <Badge variant="secondary">
                      {group.slots.length}{' '}
                      {pluralize('winner', group.slots.length)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {group.slots.map((slot, slotIndex) => (
                    <div
                      key={slot.position}
                      className="border rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Slot #{slotIndex + 1}
                        </span>
                        {slot.winner && (
                          <Badge variant="default" className="text-xs">
                            Confirmed
                          </Badge>
                        )}
                      </div>

                      {/* Winner Display */}
                      <div className="flex flex-col items-center justify-center min-h-[80px] p-3 border-2 border-dashed border-muted rounded-lg">
                        {slot.winner ? (
                          <div className="space-y-2 w-full">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {slot.winner.participant.name
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <div className="font-medium text-sm truncate">
                                    {slot.winner.participant.name}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => {
                                      if (!slot.winner) return;
                                      return router.push(
                                        `/app/${activeTeam.slug}/users/${slot.winner.participant.id}`
                                      );
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {slot.winner.participant.email}
                                </div>
                              </div>
                            </div>

                            {/* Winning Task */}
                            <div className="pt-2 border-t">
                              <button
                                onClick={() =>
                                  toggleWinnerDetails(slot.winner!.id)
                                }
                                className="w-full text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-xs text-muted-foreground">
                                      Won via
                                    </div>
                                    <div className="text-xs font-medium truncate">
                                      {slot.winner.taskCompletion.taskName}
                                    </div>
                                  </div>
                                  {expandedWinners.has(slot.winner.id) ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </button>

                              {expandedWinners.has(slot.winner.id) && (
                                <div className="mt-2 pt-2 border-t space-y-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Completion ID:
                                    </span>
                                    <div className="font-mono text-xs break-all">
                                      {slot.winner.taskCompletion.completionId}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Completed At:
                                    </span>
                                    <div>
                                      {slot.winner.taskCompletion.completedAt
                                        ? format(
                                            new Date(
                                              slot.winner.taskCompletion
                                                .completedAt
                                            ),
                                            'MMM d, yyyy h:mm a'
                                          )
                                        : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Task ID:
                                    </span>
                                    <div className="font-mono text-xs break-all">
                                      {slot.winner.taskCompletion.taskId}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/app/${activeTeam.slug}/sweepstakes/${slot.winner!.taskCompletion.sweepstakeId}/entries`
                                      );
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View in Entries Tab
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Progress Bars */}
                            <div className="space-y-1.5 pt-2">
                              <div>
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span className="text-muted-foreground">
                                    Quality
                                  </span>
                                  <span className="font-medium">
                                    {slot.winner.participant.qualityScore}
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      slot.winner.participant.qualityScore >= 80
                                        ? 'bg-green-500'
                                        : slot.winner.participant
                                              .qualityScore >= 60
                                          ? 'bg-yellow-500'
                                          : 'bg-orange-500'
                                    }`}
                                    style={{
                                      width: `${slot.winner.participant.qualityScore}%`
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span className="text-muted-foreground">
                                    Engagement
                                  </span>
                                  <span className="font-medium">
                                    {slot.winner.participant.engagement}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      slot.winner.participant.engagement >= 80
                                        ? 'bg-green-500'
                                        : slot.winner.participant.engagement >=
                                            60
                                          ? 'bg-blue-500'
                                          : 'bg-yellow-500'
                                    }`}
                                    style={{
                                      width: `${slot.winner.participant.engagement}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <DiceIcon isRolling={false} />
                            <p className="text-xs text-muted-foreground italic">
                              Waiting for draw...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {slot.winner && (
                        <Button
                          variant="outline"
                          onClick={() => handleReroll(slot.winner!.id)}
                          disabled={isRolling}
                          className="w-full"
                        >
                          <Shuffle className="h-4 w-4 mr-2" />
                          {isRolling ? 'Rolling...' : 'Re-roll'}
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Winner Selection Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5" />
              <span>{isRerollMode ? 'Re-roll Winner' : 'Pick Winners'}</span>
            </DialogTitle>
            <DialogDescription>
              {isRerollMode
                ? 'Configure the criteria for selecting a new winner to replace the current selection.'
                : `Set eligibility criteria for selecting ${emptySlots} ${pluralize('winner', emptySlots)} for empty slots.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Minimum Quality Score (%)</Label>
              <Select
                value={winnerCriteria.minQualityScore.toString()}
                onValueChange={(value) =>
                  setWinnerCriteria((prev) => ({
                    ...prev,
                    minQualityScore: parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No minimum</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="70">70% (Recommended)</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="preventDuplicates"
                checked={winnerCriteria.preventDuplicateWinners}
                onChange={(e) =>
                  setWinnerCriteria((prev) => ({
                    ...prev,
                    preventDuplicateWinners: e.target.checked
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="preventDuplicates">
                Prevent duplicate winners across all prizes
              </Label>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>{eligibleCount}</strong> of {participants.length}{' '}
                participants meet these criteria
              </div>
              {!isRerollMode &&
                winnerCriteria.preventDuplicateWinners &&
                eligibleCount < emptySlots && (
                  <div className="flex items-center space-x-2 mt-2 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Not enough eligible participants ({eligibleCount}) for{' '}
                      {emptySlots} empty {pluralize('slot', emptySlots)}.
                    </span>
                  </div>
                )}
              {eligibleCount === 0 && (
                <div className="flex items-center space-x-2 mt-2 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>No eligible participants match these criteria</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWinnerDialog(false);
                setRerollWinnerId(null);
              }}
              disabled={isRolling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={
                isRolling ||
                (isRerollMode
                  ? eligibleCount === 0
                  : winnerCriteria.preventDuplicateWinners
                    ? eligibleCount < emptySlots
                    : eligibleCount === 0)
              }
            >
              <Shuffle className="h-4 w-4 mr-2" />
              {isRolling
                ? 'Rolling...'
                : isRerollMode
                  ? 'Re-roll Winner'
                  : `Pick ${emptySlots} ${pluralize('Winner', emptySlots)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
