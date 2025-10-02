'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Trophy,
  Shuffle,
  CheckCircle,
  AlertTriangle,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  ExternalLink
} from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Participant {
  id: string;
  name: string;
  email: string;
  country: string;
  qualityScore: number;
  engagement: number;
  entriesCount: number;
}

interface SlotWinner {
  participant: Participant;
  rolledAt: string;
  isConfirmed: boolean;
  rerollCount: number;
  method: 'random' | 'manual';
}

interface PrizeSlot {
  id: string;
  position: number;
  prize: string;
  winner: SlotWinner | null;
  isRolling: boolean;
}

interface WinnerCriteria {
  minQualityScore: number;
  minEngagement: number;
  preventDuplicateWinners: boolean;
}

interface SlotBasedWinnerSystemProps {
  sweepstakesId: string;
  prizes: { id: string; name: string; position: number }[];
}

// Mock participants
const generateMockParticipants = (): Participant[] => {
  const names = [
    'Sarah Johnson',
    'Mike Chen',
    'Emma Williams',
    'Alex Rodriguez',
    'Jessica Park',
    'David Kim',
    'Lisa Zhang',
    'Tom Wilson',
    'Maria Garcia',
    'James Brown',
    'Anna Mueller',
    'Carlos Silva',
    'Nina Petrov',
    'Lucas Taylor',
    'Sophie Martin',
    'Daniel Lee',
    'Isabella Cruz',
    'Noah Anderson',
    'Mia Thompson',
    'Oliver Wang'
  ];

  const countries = [
    'US',
    'CA',
    'UK',
    'DE',
    'FR',
    'JP',
    'AU',
    'BR',
    'ES',
    'IT'
  ];

  return names.map((name, i) => ({
    id: `participant-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    country: countries[i % countries.length],
    qualityScore: Math.floor(Math.random() * 40) + 60,
    engagement: Math.floor(Math.random() * 40) + 60,
    entriesCount: Math.floor(Math.random() * 10) + 1
  }));
};

// Default prizes for demo
const defaultPrizes = [
  { id: 'prize-1', name: 'iPhone 15 Pro Max', position: 1 },
  { id: 'prize-2', name: '$500 Gift Card', position: 2 },
  { id: 'prize-3', name: '$250 Gift Card', position: 3 }
];

const DiceIcon = ({ isRolling }: { isRolling: boolean }) => {
  const [currentDice, setCurrentDice] = useState(0);
  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setCurrentDice((prev) => (prev + 1) % 6);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  const CurrentDiceIcon = diceIcons[currentDice];

  return (
    <CurrentDiceIcon
      className={`h-8 w-8 ${isRolling ? 'animate-spin' : ''} ${isRolling ? 'text-blue-500' : 'text-gray-400'}`}
    />
  );
};

export const SlotBasedWinnerSystem = ({
  prizes = defaultPrizes
}: SlotBasedWinnerSystemProps) => {
  const { activeTeam } = useTeams();
  const [participants] = useState<Participant[]>(generateMockParticipants());
  const [slots, setSlots] = useState<PrizeSlot[]>(() =>
    prizes.map((prize) => ({
      id: prize.id,
      position: prize.position,
      prize: prize.name,
      winner: null,
      isRolling: false
    }))
  );
  const [showRerollWarning, setShowRerollWarning] = useState(false);
  const [slotToReroll, setSlotToReroll] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [showPickWinnersDialog, setShowPickWinnersDialog] = useState(false);
  const [showIndividualRollDialog, setShowIndividualRollDialog] =
    useState(false);
  const [individualRollSlotId, setIndividualRollSlotId] = useState<
    string | null
  >(null);
  const [winnerCriteria, setWinnerCriteria] = useState<WinnerCriteria>({
    minQualityScore: 70,
    minEngagement: 50,
    preventDuplicateWinners: true
  });

  const getEligibleParticipants = () => {
    // Get already confirmed winner IDs to prevent duplicates if enabled
    const confirmedWinnerIds = winnerCriteria.preventDuplicateWinners
      ? slots
          .filter((s) => s.winner?.isConfirmed)
          .map((s) => s.winner!.participant.id)
      : [];

    return participants.filter((p) => {
      // Check quality score
      if (p.qualityScore < winnerCriteria.minQualityScore) return false;

      // Check engagement
      if (p.engagement < winnerCriteria.minEngagement) return false;

      // Check duplicate winners
      if (
        winnerCriteria.preventDuplicateWinners &&
        confirmedWinnerIds.includes(p.id)
      )
        return false;

      return true;
    });
  };

  const rollForSlot = async (slotId: string) => {
    // Set rolling state
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, isRolling: true } : slot
      )
    );

    // Get eligible participants based on criteria
    const eligibleParticipants = getEligibleParticipants();

    if (eligibleParticipants.length === 0) {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId ? { ...slot, isRolling: false } : slot
        )
      );
      return;
    }

    // Simulate rolling animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Select random participant
    const selectedParticipant =
      eligibleParticipants[
        Math.floor(Math.random() * eligibleParticipants.length)
      ];

    const currentSlot = slots.find((s) => s.id === slotId);
    const newWinner: SlotWinner = {
      participant: selectedParticipant,
      rolledAt: new Date().toISOString(),
      isConfirmed: false,
      rerollCount:
        (currentSlot?.winner?.rerollCount || 0) + (currentSlot?.winner ? 1 : 0),
      method: 'random'
    };

    // Update slot with new winner
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, winner: newWinner, isRolling: false }
          : slot
      )
    );
  };

  const confirmWinner = (slotId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId && slot.winner
          ? { ...slot, winner: { ...slot.winner, isConfirmed: true } }
          : slot
      )
    );
  };

  const handleReroll = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot?.winner?.isConfirmed) {
      setSlotToReroll(slotId);
      setShowRerollWarning(true);
    } else {
      rollForSlot(slotId);
    }
  };

  const removeSelection = (slotId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, winner: null } : slot
      )
    );
  };

  const confirmRemoveSelection = () => {
    if (slotToReroll && justification.trim()) {
      removeSelection(slotToReroll);
      setSlotToReroll(null);
      setJustification('');
    }
    setShowRerollWarning(false);
  };

  const confirmedCount = slots.filter(
    (slot) => slot.winner?.isConfirmed
  ).length;
  const eligibleCount = getEligibleParticipants().length;

  const handlePickAllWinners = async () => {
    setShowPickWinnersDialog(false);

    for (const slot of slots) {
      if (!slot.winner && !slot.isRolling) {
        await rollForSlot(slot.id);
      }
    }
  };

  const handleIndividualRoll = (slotId: string) => {
    setIndividualRollSlotId(slotId);
    setShowIndividualRollDialog(true);
  };

  const handleConfirmIndividualRoll = async () => {
    if (individualRollSlotId) {
      setShowIndividualRollDialog(false);
      await rollForSlot(individualRollSlotId);
      setIndividualRollSlotId(null);
    }
  };

  const hasWinners = slots.some((slot) => slot.winner);

  return (
    <div className="space-y-6">
      {/* Winners Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Winner Selection</span>
                {hasWinners && (
                  <Badge variant="secondary">
                    {confirmedCount}/{slots.length} confirmed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {hasWinners
                  ? 'Review and manage selected winners. You can re-roll individual winners or confirm them.'
                  : `${slots.length} prize${slots.length > 1 ? 's' : ''} available. Click "Pick Winners" to begin selection.`}
              </CardDescription>
            </div>
            <Button onClick={() => setShowPickWinnersDialog(true)} className="w-full sm:w-auto">
              <Shuffle className="h-4 w-4 mr-2" />
              Pick Winners
            </Button>
          </div>
        </CardHeader>
        <CardContent className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Position</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead className="hidden md:table-cell">Quality</TableHead>
                <TableHead className="hidden md:table-cell">
                  Engagement
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>
                    <span className="font-medium">#{slot.position}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{slot.prize}</span>
                  </TableCell>
                  <TableCell>
                    {slot.isRolling ? (
                      <div className="flex items-center space-x-2">
                        <DiceIcon isRolling={true} />
                        <span className="text-sm text-muted-foreground">
                          Rolling...
                        </span>
                      </div>
                    ) : slot.winner ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {slot.winner.participant.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-sm">
                              {slot.winner.participant.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() =>
                                window.open(
                                  `/app/${activeTeam.slug}/users/user-${slot.winner!.participant.name.toLowerCase().replace(' ', '-')}`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {slot.winner.participant.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not selected
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {slot.winner && !slot.isRolling ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              slot.winner.participant.qualityScore >= 80
                                ? 'bg-green-500'
                                : slot.winner.participant.qualityScore >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                            }`}
                            style={{
                              width: `${slot.winner.participant.qualityScore}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {slot.winner.participant.qualityScore}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {slot.winner && !slot.isRolling ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              slot.winner.participant.engagement >= 80
                                ? 'bg-green-500'
                                : slot.winner.participant.engagement >= 60
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{
                              width: `${slot.winner.participant.engagement}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {slot.winner.participant.engagement}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!slot.winner ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIndividualRoll(slot.id)}
                          disabled={slot.isRolling}
                        >
                          <Shuffle className="h-3 w-3 mr-1" />
                          Roll
                        </Button>
                      ) : slot.winner.isConfirmed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReroll(slot.id)}
                        >
                          Re-roll
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReroll(slot.id)}
                            disabled={slot.isRolling}
                          >
                            Re-roll
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => confirmWinner(slot.id)}
                            disabled={slot.isRolling}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {slots.map((slot) => (
          <Card key={slot.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Prize #{slot.position}: {slot.prize}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Winner Display */}
              <div className="flex flex-col items-center justify-center min-h-[80px] p-3 border-2 border-dashed border-muted rounded-lg">
                {slot.isRolling ? (
                  <div className="text-center space-y-1">
                    <DiceIcon isRolling={true} />
                    <p className="text-xs text-muted-foreground">Rolling...</p>
                  </div>
                ) : slot.winner ? (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {slot.winner.participant.name
                            .split(' ')
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
                            onClick={() =>
                              window.open(
                                `/app/${activeTeam.slug}/users/user-${slot.winner!.participant.name.toLowerCase().replace(' ', '-')}`,
                                '_blank'
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {slot.winner.participant.email}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">Quality</span>
                          <span className="font-medium">
                            {slot.winner.participant.qualityScore}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              slot.winner.participant.qualityScore >= 80
                                ? 'bg-green-500'
                                : slot.winner.participant.qualityScore >= 60
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
                                : slot.winner.participant.engagement >= 60
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
                    <p className="text-xs text-muted-foreground">
                      No winner selected
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!slot.winner ? (
                  <Button
                    onClick={() => handleIndividualRoll(slot.id)}
                    disabled={slot.isRolling}
                    className="flex-1"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Roll
                  </Button>
                ) : slot.winner.isConfirmed ? (
                  <Button
                    variant="outline"
                    onClick={() => handleReroll(slot.id)}
                    className="flex-1"
                  >
                    Re-roll
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleReroll(slot.id)}
                      disabled={slot.isRolling}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Re-roll
                    </Button>
                    <Button
                      onClick={() => confirmWinner(slot.id)}
                      disabled={slot.isRolling}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pick Winners Configuration Dialog */}
      <Dialog
        open={showPickWinnersDialog}
        onOpenChange={setShowPickWinnersDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5" />
              <span>Configure Winner Selection</span>
            </DialogTitle>
            <DialogDescription>
              Set eligibility criteria for selecting {slots.length} winner
              {slots.length > 1 ? 's' : ''} across {slots.length} prize
              {slots.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <Label>Minimum Engagement (%)</Label>
                <Select
                  value={winnerCriteria.minEngagement.toString()}
                  onValueChange={(value) =>
                    setWinnerCriteria((prev) => ({
                      ...prev,
                      minEngagement: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50% (Recommended)</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {eligibleCount < slots.length && (
                <div className="flex items-center space-x-2 mt-2 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Not enough eligible participants ({eligibleCount}) for{' '}
                    {slots.length} prize{slots.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPickWinnersDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePickAllWinners}
              disabled={eligibleCount < slots.length}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Pick Winners
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Roll Dialog */}
      <Dialog
        open={showIndividualRollDialog}
        onOpenChange={setShowIndividualRollDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5" />
              <span>Roll for Winner</span>
            </DialogTitle>
            <DialogDescription>
              {individualRollSlotId &&
                (() => {
                  const slot = slots.find((s) => s.id === individualRollSlotId);
                  return slot
                    ? `Configure criteria for selecting a winner for ${slot.prize}.`
                    : '';
                })()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <Label>Minimum Engagement (%)</Label>
                <Select
                  value={winnerCriteria.minEngagement.toString()}
                  onValueChange={(value) =>
                    setWinnerCriteria((prev) => ({
                      ...prev,
                      minEngagement: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50% (Recommended)</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="indivPreventDuplicates"
                checked={winnerCriteria.preventDuplicateWinners}
                onChange={(e) =>
                  setWinnerCriteria((prev) => ({
                    ...prev,
                    preventDuplicateWinners: e.target.checked
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="indivPreventDuplicates">
                Prevent duplicate winners across all prizes
              </Label>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>{eligibleCount}</strong> of {participants.length}{' '}
                participants meet these criteria
              </div>
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
              onClick={() => setShowIndividualRollDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmIndividualRoll}
              disabled={eligibleCount === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Roll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reroll Warning Dialog */}
      <AlertDialog open={showRerollWarning} onOpenChange={setShowRerollWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Remove Confirmed Winner?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              This slot already has a confirmed winner. Removing the selection
              will replace them with a new winner. Please provide a
              justification for this change:
            </AlertDialogDescription>
            <div className="mt-4">
              <Label htmlFor="justification">Justification (required)</Label>
              <Input
                id="justification"
                placeholder="Enter reason for changing the confirmed winner..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRerollWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveSelection}
              disabled={!justification.trim()}
            >
              Remove Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
