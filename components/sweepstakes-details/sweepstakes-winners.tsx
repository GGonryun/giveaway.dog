'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Shuffle, Info, Pencil, GiftIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { CompleteSweepstakesAlert } from '../sweepstakes-editor/complete-sweepstakes-alert';
import {
  DerivedSweepstakeStatus,
  EDITABLE_DERIVED_STATUS
} from '@/schemas/sweepstakes';
import { PrizeDrawResult, UserSource } from '@prisma/client';
import { DisqualificationDialog } from './disqualification-dialog';
import { TASK_LABEL } from '@/lib/task/schemas';
import {
  USER_SOURCE_LABEL,
  USER_SOURCE_DESCRIPTION,
  USER_SOURCE_MANAGEABLE,
  USER_SOURCE_COMING_SOON
} from '@/lib/user-source/data';
import { Checkbox } from '@/components/ui/checkbox';
import { widetype } from '@/lib/widetype';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { DEFAULT_ALLOWED_USER_SOURCES } from '@/schemas/giveaway/defaults';

interface GroupedPrize {
  id: string;
  name: string;
  quota: number;
  draws: SweepstakesPrizeSchema['draws'];
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

interface PrizeDrawRowProps {
  draw: SweepstakesPrizeSchema['draws'][0];
  index: number;
  isEditable: boolean;
  isRolling: boolean;
  onReroll: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  teamSlug: string;
}

const PrizeDrawRow = ({
  draw,
  index,
  isEditable,
  isRolling,
  onReroll,
  onViewDisqualification,
  teamSlug
}: PrizeDrawRowProps) => {
  const router = useRouter();

  const handleUserClick = () => {
    router.push(
      `/app/${teamSlug}/sweepstakes/${draw.taskCompletion.sweepstakeId}/winners/user/${draw.participant.id}`
    );
  };

  const handleTaskClick = () => {
    router.push(
      `/app/${teamSlug}/sweepstakes/${draw.taskCompletion.sweepstakeId}/winners/task/${draw.taskCompletion.taskId}?active=${draw.taskCompletion.completionId}`
    );
  };

  return (
    <TableRow key={draw.id}>
      <TableCell className="font-medium">#{index + 1}</TableCell>
      <TableCell>
        <Button
          variant="link"
          className="p-0 m-0 h-auto font-medium hover:text-primary transition-colors cursor-pointer text-left"
          onClick={handleUserClick}
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {draw.participant.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {draw.participant.email}
            </div>
          </div>
        </Button>
      </TableCell>
      <TableCell>
        <Button
          variant="link"
          className="p-0 m-0 h-auto font-medium hover:text-primary transition-colors cursor-pointer text-left"
          onClick={handleTaskClick}
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {draw.taskCompletion.taskName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {TASK_LABEL[draw.taskCompletion.taskType]}
            </div>
          </div>
        </Button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  draw.participant.qualityScore >= 80
                    ? 'bg-green-500'
                    : draw.participant.qualityScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                }`}
                style={{
                  width: `${draw.participant.qualityScore}%`
                }}
              />
            </div>
          </div>
          <span className="text-xs font-medium">
            {draw.participant.qualityScore}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {draw.result === PrizeDrawResult.WINNER ? (
          <Badge variant="default">Winner</Badge>
        ) : (
          <Badge variant="destructive">Disqualified</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {draw.result === PrizeDrawResult.WINNER ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReroll(draw.id)}
            disabled={isRolling || !isEditable}
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Re-roll
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDisqualification(draw)}
          >
            <Info className="h-3 w-3 mr-1" />
            View Reason
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const PrizeCard: React.FC<{
  prize: GroupedPrize;
  isEditable: boolean;
  isRolling: boolean;
  hasEnded: boolean;
  onReroll: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  onPickForSlot: () => void;
  teamSlug: string;
}> = ({
  prize,
  isEditable,
  isRolling,
  hasEnded,
  onReroll,
  onViewDisqualification,
  onPickForSlot,
  teamSlug
}) => {
  const winnerCount = prize.draws.filter(
    (d) => d.result === PrizeDrawResult.WINNER
  ).length;
  const isComplete = winnerCount >= prize.quota;

  return (
    <Card key={prize.id} className="pb-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-1">
            <GiftIcon className="mb-0.5" />
            {prize.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? 'default' : 'secondary'}>
              {winnerCount} / {prize.quota} {pluralize('winner', winnerCount)}{' '}
              selected
            </Badge>
            {isComplete && (
              <Badge variant="default" className="bg-green-600">
                Complete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 border-t">
        {prize.draws.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Task Completed</TableHead>
                <TableHead className="w-[120px]">Quality</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <PrizeDraws
                draws={prize.draws}
                isEditable={isEditable}
                isRolling={isRolling}
                onReroll={onReroll}
                onViewDisqualification={onViewDisqualification}
                teamSlug={teamSlug}
              />
            </TableBody>
          </Table>
        ) : (
          <EmptyPrizeState
            hasEnded={hasEnded}
            isEditable={isEditable}
            isRolling={isRolling}
            onPickForSlot={onPickForSlot}
          />
        )}
      </CardContent>
    </Card>
  );
};

const PrizeDraws: React.FC<{
  draws: SweepstakesPrizeSchema['draws'];
  isEditable?: boolean;
  isRolling?: boolean;
  onReroll: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  teamSlug: string;
}> = ({
  draws,
  isEditable = false,
  isRolling = false,
  onReroll,
  onViewDisqualification,
  teamSlug
}) => {
  const sorted = draws
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return (
    <>
      {sorted.map((draw, index) => (
        <PrizeDrawRow
          key={draw.id}
          draw={draw}
          index={index}
          isEditable={isEditable}
          isRolling={isRolling}
          onReroll={onReroll}
          onViewDisqualification={onViewDisqualification}
          teamSlug={teamSlug}
        />
      ))}
    </>
  );
};

interface EmptyPrizeStateProps {
  hasEnded: boolean;
  isEditable: boolean;
  isRolling: boolean;
  onPickForSlot: () => void;
}

const EmptyPrizeState = ({
  hasEnded,
  isEditable,
  isRolling,
  onPickForSlot
}: EmptyPrizeStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <DiceIcon isRolling={false} />
      <p className="text-sm text-muted-foreground mt-4">
        No draws yet for this prize
      </p>
      {hasEnded && isEditable && (
        <Button
          variant="outline"
          size="sm"
          onClick={onPickForSlot}
          disabled={isRolling}
          className="mt-4"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          {isRolling ? 'Rolling...' : 'Pick Winner'}
        </Button>
      )}
    </div>
  );
};

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
  const [rerollDialogOpen, setRerollDialogOpen] = useState(false);
  const [rerollWinnerId, setRerollWinnerId] = useState<string | null>(null);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [viewDisqualificationDialog, setViewDisqualificationDialog] =
    useState(false);
  const [selectedDisqualifiedDraw, setSelectedDisqualifiedDraw] = useState<
    SweepstakesPrizeSchema['draws'][0] | null
  >(null);

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
      existing.draws.push(...prize.draws);
    } else {
      acc.push({
        id: prize.id,
        name: prize.name,
        quota: prizes.filter((p) => p.id === prize.id).length,
        draws: [...prize.draws]
      });
    }
    return acc;
  }, [] as GroupedPrize[]);

  const getPrizeWinnerCount = (prize: GroupedPrize) => {
    return prize.draws.filter((d) => d.result === PrizeDrawResult.WINNER)
      .length;
  };

  const isPrizeComplete = (prize: GroupedPrize) => {
    return getPrizeWinnerCount(prize) >= prize.quota;
  };

  const allPrizesComplete = groupedPrizes.every(isPrizeComplete);

  const incompletePrizes = groupedPrizes.filter((p) => !isPrizeComplete(p));

  const hasEnded = new Date() > new Date(endDate);

  const getEligibleParticipants = (
    criteria: SweepstakesWinnerCriteriaSchema
  ) => {
    const confirmedWinnerIds = !criteria.allowMultipleWins
      ? prizes
          .flatMap((p) => p.draws)
          .filter((d) => d.result === PrizeDrawResult.WINNER)
          .map((d) => d.participant.id)
      : [];

    return participants.filter((p) => {
      // Check quality score
      if (p.qualityScore < criteria.minQualityScore) return false;

      // Check minimum tasks completed
      if (p.entries.length < criteria.minTasksCompleted) return false;

      // Check duplicate winners
      if (!criteria.allowMultipleWins && confirmedWinnerIds.includes(p.id))
        return false;

      return true;
    });
  };

  const handleReroll = (winnerId: string) => {
    setRerollWinnerId(winnerId);
    setDisqualificationReason('');
    setRerollDialogOpen(true);
  };

  const handleRerollSubmit = () => {
    if (!rerollWinnerId || !disqualificationReason.trim()) return;

    runRollWinners({
      sweepstakesId,
      slug,
      minQualityScore: currentCriteria.minQualityScore,
      minTasksCompleted: currentCriteria.minTasksCompleted,
      preventDuplicateWinners: !currentCriteria.allowMultipleWins,
      rerollWinnerId: rerollWinnerId,
      disqualificationReason: disqualificationReason.trim()
    });

    setRerollDialogOpen(false);
    setRerollWinnerId(null);
    setDisqualificationReason('');
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
      allowMultipleWins: editedCriteria.allowMultipleWins,
      externalPlatforms: editedCriteria.externalPlatforms
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

  const handleViewDisqualification = (
    draw: SweepstakesPrizeSchema['draws'][0]
  ) => {
    setSelectedDisqualifiedDraw(draw);
    setViewDisqualificationDialog(true);
  };

  const hasAnyWinners = prizes.some((p) =>
    p.draws.some((d) => d.result === PrizeDrawResult.WINNER)
  );

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
          <div className="space-y-3">
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
                  {getEligibleParticipants(currentCriteria).length} /{' '}
                  {participants.length}
                </Badge>
              </div>
            </div>
            {currentCriteria.externalPlatforms && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Allowed Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {currentCriteria.externalPlatforms.map((source) => (
                    <Badge key={source} variant="outline">
                      {USER_SOURCE_LABEL[source as UserSource]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {participants.some(
            (p) =>
              p.qualityScore < currentCriteria.minQualityScore &&
              p.entries.length >= currentCriteria.minTasksCompleted
          ) && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Some participants (including Twitter imports with base quality
                score of 30) are being filtered out by your quality threshold.
                Consider lowering the minimum quality score to{' '}
                {Math.min(...participants.map((p) => p.qualityScore))}% to
                include all participants.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={rerollDialogOpen} onOpenChange={setRerollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-roll Winner</DialogTitle>
            <DialogDescription>
              Provide a justification for re-rolling this winner. The current
              winner will be marked as disqualified and this action will be
              recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disqualification-reason">
                Disqualification Reason *
              </Label>
              <Textarea
                id="disqualification-reason"
                placeholder="e.g., Winner did not respond, violated rules, etc."
                value={disqualificationReason}
                onChange={(e) => setDisqualificationReason(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This reason will be visible in the draw history.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRerollDialogOpen(false)}
              disabled={isRolling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRerollSubmit}
              disabled={!disqualificationReason.trim() || isRolling}
            >
              {isRolling ? 'Rolling...' : 'Confirm Re-roll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DisqualificationDialog
        open={viewDisqualificationDialog}
        onOpenChange={setViewDisqualificationDialog}
        participantName={selectedDisqualifiedDraw?.participant.name || null}
        participantEmail={selectedDisqualifiedDraw?.participant.email || null}
        disqualificationReason={
          selectedDisqualifiedDraw?.disqualificationReason || null
        }
        drawDate={selectedDisqualifiedDraw?.createdAt || null}
      />

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

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowExternalUsers"
                  checked={Boolean(editedCriteria.externalPlatforms)}
                  onCheckedChange={(checked) =>
                    setEditedCriteria((prev) => ({
                      ...prev,
                      externalPlatforms: checked
                        ? DEFAULT_ALLOWED_USER_SOURCES
                        : null
                    }))
                  }
                />
                <Label htmlFor="allowExternalUsers">
                  Restrict winner sources
                </Label>
              </div>
              <Collapsible open={Boolean(editedCriteria.externalPlatforms)}>
                <CollapsibleContent className="space-y-1 pl-6">
                  {widetype
                    .entries(USER_SOURCE_LABEL)
                    .filter(([key]) => USER_SOURCE_MANAGEABLE[key])
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex gap-2 items-center py-0.5">
                              <Checkbox
                                id={`edit-source-${key}`}
                                checked={
                                  editedCriteria.externalPlatforms?.includes(
                                    key
                                  ) ?? false
                                }
                                disabled={USER_SOURCE_COMING_SOON[key]}
                                onCheckedChange={(checked) => {
                                  const currentValue =
                                    editedCriteria.externalPlatforms || [];
                                  setEditedCriteria((prev) => ({
                                    ...prev,
                                    externalPlatforms: checked
                                      ? [...currentValue, key]
                                      : currentValue.filter((v) => v !== key)
                                  }));
                                }}
                              />
                              <Label
                                htmlFor={`edit-source-${key}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {value}
                              </Label>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            {USER_SOURCE_COMING_SOON[key]
                              ? 'Coming Soon'
                              : USER_SOURCE_DESCRIPTION[key]}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                </CollapsibleContent>
              </Collapsible>
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

      {!hasEnded && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Winners Can Only Be Selected After Giveaway Ends
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            Once your giveaway has ended, you will be able to select and confirm
            winners. Until then, this section will remain locked.
          </AlertDescription>
        </Alert>
      )}

      {!hasAnyWinners ? (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-center sm:text-left">
              <p className="font-medium">No winners selected yet</p>
              <p className="text-sm text-muted-foreground">
                Ready to select winners for {groupedPrizes.length}{' '}
                {pluralize('prize', groupedPrizes.length)}
              </p>
            </div>
            <Button
              onClick={handlePickWinners}
              disabled={isRolling || !isEditable || !hasEnded}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              {isRolling ? 'Rolling...' : 'Pick All Winners'}
            </Button>
          </CardContent>
        </Card>
      ) : !allPrizesComplete ? (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-center sm:text-left">
              <p className="font-medium">
                {incompletePrizes.length}{' '}
                {pluralize('prize', incompletePrizes.length)} incomplete
              </p>
              <p className="text-sm text-muted-foreground">
                Continue picking winners to complete all prizes
              </p>
            </div>
            <Button
              onClick={handlePickWinners}
              disabled={isRolling || !isEditable}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              {isRolling ? 'Rolling...' : 'Pick Remaining Winners'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        isEditable && (
          <CompleteSweepstakesAlert
            onCompleteAction={handleCompleteSweepstakes}
            isCompleting={isCompleting}
          />
        )
      )}

      <div className="space-y-4">
        {groupedPrizes.map((prize) => (
          <PrizeCard
            key={prize.id}
            prize={prize}
            isEditable={isEditable}
            isRolling={isRolling}
            hasEnded={hasEnded}
            onReroll={handleReroll}
            onViewDisqualification={handleViewDisqualification}
            onPickForSlot={handlePickForSlot}
            teamSlug={activeTeam.slug}
          />
        ))}
      </div>
    </div>
  );
};
