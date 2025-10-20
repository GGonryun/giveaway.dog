'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shuffle, ExternalLink, Info, Pencil, Trash2 } from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  SweepstakesPrizeSchema,
  SweepstakesWinnerCriteriaSchema
} from '@/schemas/giveaway/schemas';
import { DiceIcon } from './dice-icon';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { useRouter } from 'next/navigation';
import pluralize from 'pluralize';
import { useProcedure } from '@/lib/mrpc/hook';
import rollWinners from '@/procedures/sweepstakes/roll-winners';
import updateWinnerCriteria from '@/procedures/sweepstakes/update-winner-criteria';
import deleteWinner from '@/procedures/sweepstakes/delete-winner';
import completeSweepstakes from '@/procedures/sweepstakes/complete-sweepstakes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { CompleteSweepstakesAlert } from '../sweepstakes-editor/complete-sweepstakes-alert';
import {
  DerivedSweepstakeStatus,
  EDITABLE_DERIVED_STATUS
} from '@/schemas/sweepstakes';

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
  status: DerivedSweepstakeStatus;
  endDate: Date;
  criteria: SweepstakesWinnerCriteriaSchema;
}

export const SweepstakesWinners = ({
  prizes,
  participants,
  sweepstakesId,
  slug,
  status,
  endDate,
  criteria
}: SlotBasedWinnerSystemProps) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [currentCriteria, setCurrentCriteria] =
    useState<SweepstakesWinnerCriteriaSchema>(criteria);
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [editedCriteria, setEditedCriteria] =
    useState<SweepstakesWinnerCriteriaSchema>(criteria);

  const isEditable = EDITABLE_DERIVED_STATUS[status];

  const { run: runRollWinners, isLoading: isRolling } = useProcedure({
    action: rollWinners,
    onSuccess: () => {
      router.refresh();
    }
  });

  const { run: runUpdateCriteria, isLoading: isUpdatingCriteria } =
    useProcedure({
      action: updateWinnerCriteria,
      onSuccess: (data) => {
        setCurrentCriteria(data);
        setEditedCriteria(data);
        setIsEditingCriteria(false);
        router.refresh();
      }
    });

  const { run: runDeleteWinner, isLoading: isDeleting } = useProcedure({
    action: deleteWinner,
    onSuccess: () => {
      router.refresh();
    }
  });

  const { run: runCompleteSweepstakes, isLoading: isCompleting } = useProcedure(
    {
      action: completeSweepstakes,
      onSuccess: () => {
        router.push(`/app/${slug}`);
      }
    }
  );

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

  const hasEnded = new Date() > new Date(endDate);

  const getEligibleParticipants = (
    criteriaToUse: SweepstakesWinnerCriteriaSchema = currentCriteria
  ) => {
    const confirmedWinnerIds = !criteriaToUse.allowMultipleWins
      ? prizes.filter((s) => s.winner).map((s) => s.winner!.participant.id)
      : [];

    return participants.filter((p) => {
      // Check quality score
      if (p.qualityScore < criteriaToUse.minQualityScore) return false;

      // Check minimum tasks completed
      if (p.entries.length < criteriaToUse.minTasksCompleted) return false;

      // Check duplicate winners
      if (!criteriaToUse.allowMultipleWins && confirmedWinnerIds.includes(p.id))
        return false;

      return true;
    });
  };

  const handleReroll = (winnerId: string) => {
    runRollWinners({
      sweepstakesId,
      slug,
      minQualityScore: currentCriteria.minQualityScore,
      minTasksCompleted: currentCriteria.minTasksCompleted,
      preventDuplicateWinners: !currentCriteria.allowMultipleWins,
      rerollWinnerId: winnerId
    });
  };

  const handleDeleteWinner = (winnerId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this winner? This action cannot be undone.'
      )
    ) {
      runDeleteWinner({
        winnerId,
        sweepstakesId
      });
    }
  };

  const handlePickForSlot = () => {
    runRollWinners({
      sweepstakesId,
      slug,
      minQualityScore: currentCriteria.minQualityScore,
      minTasksCompleted: currentCriteria.minTasksCompleted,
      preventDuplicateWinners: !currentCriteria.allowMultipleWins
    });
  };

  const handlePickWinners = () => {
    runRollWinners({
      sweepstakesId,
      slug,
      minQualityScore: currentCriteria.minQualityScore,
      minTasksCompleted: currentCriteria.minTasksCompleted,
      preventDuplicateWinners: !currentCriteria.allowMultipleWins
    });
  };

  const handleSaveCriteria = () => {
    runUpdateCriteria({
      sweepstakesId,
      slug,
      minTasksCompleted: editedCriteria.minTasksCompleted,
      minQualityScore: editedCriteria.minQualityScore,
      allowMultipleWins: editedCriteria.allowMultipleWins
    });
  };

  const handleCancelEdit = () => {
    setEditedCriteria(currentCriteria);
    setIsEditingCriteria(false);
  };

  const handleCompleteSweepstakes = () => {
    runCompleteSweepstakes({
      sweepstakesId,
      slug
    });
  };

  const hasAnyWinners = prizes.some((p) => p.winner);

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Winner Selection Criteria</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingCriteria(true)}
              disabled={!isEditable}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Min Tasks:</span>
              <Badge variant="secondary">
                {currentCriteria.minTasksCompleted}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Min Quality:</span>
              <Badge variant="secondary">
                {currentCriteria.minQualityScore}%
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Multiple Wins:</span>
              <Badge variant="secondary">
                {currentCriteria.allowMultipleWins ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-muted-foreground">Eligible:</span>
              <Badge variant="default">
                {getEligibleParticipants().length} / {participants.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditingCriteria} onOpenChange={setIsEditingCriteria}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Winner Selection Criteria</DialogTitle>
            <DialogDescription>
              Set requirements for participant eligibility when selecting
              winners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minTasksCompleted">Minimum Tasks Completed</Label>
              <Input
                id="minTasksCompleted"
                type="number"
                min={1}
                value={editedCriteria.minTasksCompleted}
                onChange={(e) =>
                  setEditedCriteria((prev) => ({
                    ...prev,
                    minTasksCompleted: parseInt(e.target.value) || 1
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minQualityScore">Minimum Quality Score (%)</Label>
              <Select
                value={editedCriteria.minQualityScore.toString()}
                onValueChange={(value) =>
                  setEditedCriteria((prev) => ({
                    ...prev,
                    minQualityScore: parseInt(value)
                  }))
                }
              >
                <SelectTrigger id="minQualityScore">
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
              <Switch
                id="allowMultipleWins"
                checked={editedCriteria.allowMultipleWins}
                onCheckedChange={(checked) =>
                  setEditedCriteria((prev) => ({
                    ...prev,
                    allowMultipleWins: checked
                  }))
                }
              />
              <Label htmlFor="allowMultipleWins">
                Allow users to win multiple prizes
              </Label>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>
                  {getEligibleParticipants(editedCriteria).length}
                </strong>{' '}
                of {participants.length} participants meet these criteria
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isUpdatingCriteria}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCriteria} disabled={isUpdatingCriteria}>
              {isUpdatingCriteria ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hasAnyWinners ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            {!hasEnded && (
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
            )}
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
              <Button
                size="lg"
                className="mt-4"
                disabled={!hasEnded || !isEditable}
                onClick={handlePickWinners}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Pick Winners
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {emptySlots > 0 ? (
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
                  onClick={handlePickWinners}
                  disabled={isRolling || !isEditable}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {isRolling ? 'Rolling...' : 'Pick Remaining'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            isEditable && (
              <CompleteSweepstakesAlert
                onComplete={handleCompleteSweepstakes}
                isCompleting={isCompleting}
              />
            )
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

                      <div className="flex flex-col items-center justify-center min-h-[80px] p-3 border-2 border-dashed border-muted rounded-lg">
                        {slot.winner ? (
                          <div className="space-y-2 w-full">
                            <div className="flex items-center space-x-2">
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

                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-muted-foreground">
                                    Won via
                                  </div>
                                  <div className="text-xs font-medium truncate">
                                    {slot.winner.taskCompletion.taskName}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    router.push(
                                      `/app/${activeTeam.slug}/sweepstakes/${slot.winner!.taskCompletion.sweepstakeId}/entries`
                                    );
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

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
                          <div className="flex flex-col items-center text-center gap-y-2">
                            <DiceIcon isRolling={false} />
                            <p className="text-xs text-muted-foreground italic">
                              Waiting for draw...
                            </p>
                            {hasEnded && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePickForSlot}
                                disabled={isRolling || !isEditable}
                                className="w-full"
                              >
                                <Shuffle className="h-4 w-4 mr-2" />
                                {isRolling ? 'Rolling...' : 'Pick Winner'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {slot.winner && isEditable && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!slot.winner)
                                return alert('No winner to re-roll');
                              handleReroll(slot.winner.id);
                            }}
                            disabled={isRolling || isDeleting}
                            className="flex-1"
                          >
                            <Shuffle className="h-4 w-4 mr-2" />
                            {isRolling ? 'Rolling...' : 'Re-roll'}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (!slot.winner)
                                return alert('No winner to re-roll');

                              return handleDeleteWinner(slot.winner.id);
                            }}
                            disabled={isRolling || isDeleting}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
