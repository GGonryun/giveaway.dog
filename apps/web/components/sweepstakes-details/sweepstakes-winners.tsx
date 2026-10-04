'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import {
  Shuffle,
  Info,
  Pencil,
  GiftIcon,
  Trophy,
  MoreHorizontal,
  Eye,
  BanIcon
} from 'lucide-react';
import { useTeams } from '@giveaway/team-context/team-provider';
import { Label } from '@giveaway/ui-primitives/label';
import {
  SweepstakesPrizeSchema,
  SweepstakesWinnerCriteriaSchema
} from '@giveaway/sweepstakes-model/schemas';
import { DiceIcon } from './dice-icon';
import { useRouter } from 'next/navigation';
import pluralize from 'pluralize';
import { useProcedure } from '@giveaway/rpc-client/hook';
import updateWinnerCriteria from '@giveaway/sweepstakes-moderation-server/update-winner-criteria';
import completeSweepstakes from '@giveaway/sweepstakes-editor-server/complete-sweepstakes';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { Input } from '@giveaway/ui-primitives/input';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@giveaway/ui-primitives/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { Textarea } from '@giveaway/ui-primitives/textarea';
import { CompleteSweepstakesAlert } from '@giveaway/sweepstakes-editor-core/complete-sweepstakes-alert';
import { BotEnforcementField } from '@giveaway/user-quality-ui/bot-enforcement-field';
import {
  DerivedSweepstakeStatus,
  EDITABLE_DERIVED_STATUS
} from '@giveaway/sweepstakes-model/sweepstakes';
import { PrizeDrawResult, UserSource } from '@prisma/client';
import { DisqualificationDialog } from '@giveaway/sweepstakes-ui/disqualification-dialog';
import { TASK_LABEL } from '@giveaway/task-model/schemas';
import { USER_SOURCE_LABEL } from '@giveaway/user-source-model/data';
import { SweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import {
  toQualityType,
  QUALITY_LABELS
} from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@giveaway/user-quality-ui/display';
import { rollPrizes } from '@giveaway/winners-server/procedures/roll-prizes';
import { rollPrize } from '@giveaway/winners-server/procedures/roll-prize';
import { rerollDraw } from '@giveaway/winners-server/procedures/reroll-draw';
import { disqualifyDraw } from '@giveaway/winners-server/procedures/disqualify-draw';
import { UNKNOWN_EMAIL } from '@giveaway/app-config/settings';
import { strings } from '@giveaway/util-strings/strings';

interface GroupedPrize {
  id: string;
  name: string;
  quota: number;
  draws: SweepstakesPrizeSchema['draws'];
}

interface PrizeDrawRowProps {
  draw: SweepstakesPrizeSchema['draws'][0];
  index: number;
  isEditable: boolean;
  isRolling: boolean;
  onReroll: (drawId: string) => void;
  onDisqualify: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  teamSlug: string;
}

const PrizeDrawRow = ({
  draw,
  index,
  isEditable,
  isRolling,
  onReroll,
  onDisqualify,
  onViewDisqualification,
  teamSlug
}: PrizeDrawRowProps) => {
  const router = useRouter();

  const handleUserClick = () => {
    router.push(
      `/app/${teamSlug}/sweepstakes/${draw.taskCompletion.sweepstake.id}/winners/user/${draw.participant.id}`
    );
  };

  const handleTaskClick = () => {
    router.push(
      `/app/${teamSlug}/sweepstakes/${draw.taskCompletion.sweepstake.id}/winners/task/${draw.taskCompletion.task.id}?active=${draw.taskCompletion.id}`
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
              {strings.obfuscate(draw.participant.email) ?? UNKNOWN_EMAIL}
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
              {draw.taskCompletion.task.title}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {TASK_LABEL[draw.taskCompletion.task.type]}
            </div>
          </div>
        </Button>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            QUALITY_BADGE_VARIANT[toQualityType(draw.participant.qualityScore)]
          }
        >
          {QUALITY_LABELS[toQualityType(draw.participant.qualityScore)]}
        </Badge>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRolling || !isEditable}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDisqualify(draw.id)}>
                <BanIcon className="h-4 w-4 mr-2" />
                Disqualify
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReroll(draw.id)}>
                <Shuffle className="h-4 w-4 mr-2" />
                Re-roll
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDisqualification(draw)}>
                <Eye className="h-4 w-4 mr-2" />
                View Reason
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  onDisqualify: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  onPickForSlot: () => void;
  teamSlug: string;
}> = ({
  prize,
  isEditable,
  isRolling,
  hasEnded,
  onReroll,
  onDisqualify,
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
              {winnerCount} / {prize.quota} {pluralize('winner', prize.quota)}{' '}
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
                onDisqualify={onDisqualify}
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
  onDisqualify: (drawId: string) => void;
  onViewDisqualification: (draw: SweepstakesPrizeSchema['draws'][0]) => void;
  teamSlug: string;
}> = ({
  draws,
  isEditable = false,
  isRolling = false,
  onReroll,
  onDisqualify,
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
          onDisqualify={onDisqualify}
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

type SweepstakesWinnersProps = {
  prizes: SweepstakesPrizeSchema[];
  participants: SweepstakesParticipantSchema[];
  sweepstakesId: string;
  slug: string;
  status: DerivedSweepstakeStatus;
  endDate: Date;
  criteria: SweepstakesWinnerCriteriaSchema;
};

export const SweepstakesWinners = ({
  prizes,
  participants,
  sweepstakesId,
  slug,
  status,
  endDate,
  criteria
}: SweepstakesWinnersProps) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [currentCriteria, setCurrentCriteria] =
    useState<SweepstakesWinnerCriteriaSchema>(criteria);
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [editedCriteria, setEditedCriteria] =
    useState<SweepstakesWinnerCriteriaSchema>(criteria);
  const [rerollDialogOpen, setRerollDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'disqualify' | 'reroll'>(
    'reroll'
  );
  const [drawId, setDrawId] = useState<string | null>(null);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [viewDisqualificationDialog, setViewDisqualificationDialog] =
    useState(false);
  const [selectedDisqualifiedDraw, setSelectedDisqualifiedDraw] = useState<
    SweepstakesPrizeSchema['draws'][0] | null
  >(null);

  const isEditable = EDITABLE_DERIVED_STATUS[status];

  const rollPrizesProcedure = useProcedure({
    action: rollPrizes,
    onSuccess: () => {
      router.refresh();
    }
  });

  const rollPrizeProcedure = useProcedure({
    action: rollPrize,
    onSuccess: () => {
      router.refresh();
    }
  });

  const rerollDrawProcedure = useProcedure({
    action: rerollDraw,
    onSuccess: () => {
      router.refresh();
    }
  });

  const disqualifyDrawProcedure = useProcedure({
    action: disqualifyDraw,
    onSuccess: () => {
      router.refresh();
    }
  });

  const isRolling = useMemo(() => {
    return (
      rollPrizesProcedure.isLoading ||
      rollPrizeProcedure.isLoading ||
      rerollDrawProcedure.isLoading ||
      disqualifyDrawProcedure.isLoading
    );
  }, [
    rollPrizesProcedure.isLoading,
    rollPrizeProcedure.isLoading,
    rerollDrawProcedure.isLoading,
    disqualifyDrawProcedure.isLoading
  ]);

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
        quota: prize.quota,
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
      if (p.user.qualityScore < criteria.minQualityScore) return false;

      // Check minimum tasks completed
      if (p.completions.length < criteria.minTasksCompleted) return false;

      // Check duplicate winners
      if (!criteria.allowMultipleWins && confirmedWinnerIds.includes(p.id))
        return false;

      return true;
    });
  };

  const handleDisqualify = (drawId: string) => {
    setActionType('disqualify');
    setDrawId(drawId);
    setDisqualificationReason('');
    setRerollDialogOpen(true);
  };

  const handleReroll = (drawId: string) => {
    setActionType('reroll');
    setDrawId(drawId);
    setDisqualificationReason('');
    setRerollDialogOpen(true);
  };

  const handleRerollSubmit = () => {
    if (!drawId || !disqualificationReason.trim()) return;

    if (actionType === 'disqualify') {
      disqualifyDrawProcedure.run({
        sweepstakesId,
        slug,
        drawId,
        disqualificationReason
      });
    } else {
      rerollDrawProcedure.run({
        sweepstakesId,
        slug,
        drawId,
        disqualificationReason
      });
    }

    setRerollDialogOpen(false);
    setDrawId(null);
    setDisqualificationReason('');
  };

  const handlePickForSlot = (prizeId: string) => {
    rollPrizeProcedure.run({
      sweepstakesId,
      slug,
      prizeId
    });
  };

  const handlePickWinners = () => {
    rollPrizesProcedure.run({
      sweepstakesId,
      slug
    });
  };

  const handlePublicDraw = () => {
    router.push(`/app/${slug}/sweepstakes/${sweepstakesId}/winners/public`);
  };

  const handleSaveCriteria = () => {
    runUpdateCriteria({
      sweepstakesId,
      slug,
      minTasksCompleted: editedCriteria.minTasksCompleted,
      minQualityScore: editedCriteria.minQualityScore,
      allowMultipleWins: editedCriteria.allowMultipleWins,
      allowUserSelection: editedCriteria.allowUserSelection,
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
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Prize Selection:</span>
                <Badge variant="secondary">
                  {currentCriteria.allowUserSelection ? 'Yes' : 'No'}
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
        </CardContent>
      </Card>

      <Dialog open={rerollDialogOpen} onOpenChange={setRerollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'disqualify'
                ? 'Disqualify User'
                : 'Disqualify & Re-roll'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'disqualify'
                ? 'Provide a justification for disqualifying this winner. This action will be recorded.'
                : 'Provide a justification for disqualifying this winner. This action will be recorded and a new winner will be selected.'}
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
              {isRolling
                ? actionType === 'disqualify'
                  ? 'Disqualifying...'
                  : 'Re-rolling...'
                : actionType === 'disqualify'
                  ? 'Disqualify'
                  : 'Disqualify & Re-roll'}
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
              <Label htmlFor="minQualityScore">Bot Enforcement</Label>
              <BotEnforcementField
                value={editedCriteria.minQualityScore}
                onChange={(value) =>
                  setEditedCriteria((prev) => ({
                    ...prev,
                    minQualityScore: value
                  }))
                }
                showAlert={false}
              />
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

            <div className="flex items-center space-x-2">
              <Switch
                id="allowUserSelection"
                checked={editedCriteria.allowUserSelection}
                onCheckedChange={(checked) =>
                  setEditedCriteria((prev) => ({
                    ...prev,
                    allowUserSelection: checked
                  }))
                }
              />
              <Label htmlFor="allowUserSelection">
                Allow participants to select prizes
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

      {!hasEnded && (
        <Alert variant="warning">
          <Info className="h-5 w-" />
          <AlertTitle>
            Winners Can Only Be Selected After Giveaway Ends
          </AlertTitle>
          <AlertDescription>
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePublicDraw}
                disabled={isRolling || !isEditable || !hasEnded}
                className="w-full sm:w-auto"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Roll with public picker
              </Button>
              <Button
                onClick={handlePickWinners}
                disabled={isRolling || !isEditable || !hasEnded}
                className="w-full sm:w-auto"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {isRolling ? 'Rolling...' : 'Pick All Winners'}
              </Button>
            </div>
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePublicDraw}
                disabled={isRolling || !isEditable}
                className="w-full sm:w-auto"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Roll with public picker
              </Button>
              <Button
                onClick={handlePickWinners}
                disabled={isRolling || !isEditable}
                className="w-full sm:w-auto"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {isRolling ? 'Rolling...' : 'Pick Remaining Winners'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {isEditable && (
            <CompleteSweepstakesAlert
              onCompleteAction={handleCompleteSweepstakes}
              isCompleting={isCompleting}
            />
          )}
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
              <div className="text-center sm:text-left">
                <p className="font-medium">All winners selected</p>
                <p className="text-sm text-muted-foreground">
                  Use the public picker to re-roll or showcase your winners
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handlePublicDraw}
                className="w-full sm:w-auto"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Open public picker
              </Button>
            </CardContent>
          </Card>
        </>
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
            onDisqualify={handleDisqualify}
            onViewDisqualification={handleViewDisqualification}
            onPickForSlot={() => handlePickForSlot(prize.id)}
            teamSlug={activeTeam.slug}
          />
        ))}
      </div>
    </div>
  );
};
