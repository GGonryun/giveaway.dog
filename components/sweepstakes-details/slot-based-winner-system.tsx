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
  Trophy,
  Shuffle,
  CheckCircle,
  AlertTriangle,
  Gift,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Settings,
  UserCheck,
  ExternalLink,
  Clock,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

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
  bannedEmails: string[];
  bannedDomains: string[];
}

interface SlotBasedWinnerSystemProps {
  sweepstakesId: string;
  prizes: { id: string; name: string; position: number }[];
}

// Mock participants
const generateMockParticipants = (): Participant[] => {
  const names = [
    'Sarah Johnson', 'Mike Chen', 'Emma Williams', 'Alex Rodriguez', 'Jessica Park',
    'David Kim', 'Lisa Zhang', 'Tom Wilson', 'Maria Garcia', 'James Brown',
    'Anna Mueller', 'Carlos Silva', 'Nina Petrov', 'Lucas Taylor', 'Sophie Martin',
    'Daniel Lee', 'Isabella Cruz', 'Noah Anderson', 'Mia Thompson', 'Oliver Wang'
  ];

  const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'JP', 'AU', 'BR', 'ES', 'IT'];

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
        setCurrentDice(prev => (prev + 1) % 6);
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
  sweepstakesId,
  prizes = defaultPrizes
}: SlotBasedWinnerSystemProps) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [participants] = useState<Participant[]>(generateMockParticipants());
  const [slots, setSlots] = useState<PrizeSlot[]>(() =>
    prizes.map(prize => ({
      id: prize.id,
      position: prize.position,
      prize: prize.name,
      winner: null,
      isRolling: false
    }))
  );
  const [showRerollWarning, setShowRerollWarning] = useState(false);
  const [slotToReroll, setSlotToReroll] = useState<string | null>(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [manualSelectionSlot, setManualSelectionSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [justification, setJustification] = useState('');
  const [showCriteriaSettings, setShowCriteriaSettings] = useState(false);
  const [criteriaConfigured, setCriteriaConfigured] = useState(false);
  const [winnerCriteria, setWinnerCriteria] = useState<WinnerCriteria>({
    minQualityScore: 70,
    minEngagement: 50,
    preventDuplicateWinners: true,
    bannedEmails: [],
    bannedDomains: []
  });

  const getEligibleParticipants = () => {
    // Get already confirmed winner IDs to prevent duplicates if enabled
    const confirmedWinnerIds = winnerCriteria.preventDuplicateWinners
      ? slots.filter(s => s.winner?.isConfirmed).map(s => s.winner!.participant.id)
      : [];

    return participants.filter(p => {
      // Check quality score
      if (p.qualityScore < winnerCriteria.minQualityScore) return false;

      // Check engagement
      if (p.engagement < winnerCriteria.minEngagement) return false;

      // Check duplicate winners
      if (winnerCriteria.preventDuplicateWinners && confirmedWinnerIds.includes(p.id)) return false;

      // Check banned emails
      if (winnerCriteria.bannedEmails.some(email =>
        p.email.toLowerCase().includes(email.toLowerCase())
      )) return false;

      // Check banned domains
      if (winnerCriteria.bannedDomains.some(domain =>
        p.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
      )) return false;

      return true;
    });
  };

  const rollForSlot = async (slotId: string) => {
    // Set rolling state
    setSlots(prev => prev.map(slot =>
      slot.id === slotId ? { ...slot, isRolling: true } : slot
    ));

    // Get eligible participants based on criteria
    const eligibleParticipants = getEligibleParticipants();

    if (eligibleParticipants.length === 0) {
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, isRolling: false } : slot
      ));
      return;
    }

    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select random participant
    const selectedParticipant = eligibleParticipants[
      Math.floor(Math.random() * eligibleParticipants.length)
    ];

    const currentSlot = slots.find(s => s.id === slotId);
    const newWinner: SlotWinner = {
      participant: selectedParticipant,
      rolledAt: new Date().toISOString(),
      isConfirmed: false,
      rerollCount: (currentSlot?.winner?.rerollCount || 0) + (currentSlot?.winner ? 1 : 0),
      method: 'random'
    };

    // Update slot with new winner
    setSlots(prev => prev.map(slot =>
      slot.id === slotId
        ? { ...slot, winner: newWinner, isRolling: false }
        : slot
    ));
  };

  const confirmWinner = (slotId: string) => {
    setSlots(prev => prev.map(slot =>
      slot.id === slotId && slot.winner
        ? { ...slot, winner: { ...slot.winner, isConfirmed: true } }
        : slot
    ));
  };

  const handleReroll = (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot?.winner?.isConfirmed) {
      setSlotToReroll(slotId);
      setShowRerollWarning(true);
    } else {
      rollForSlot(slotId);
    }
  };

  const removeSelection = (slotId: string) => {
    setSlots(prev => prev.map(slot =>
      slot.id === slotId
        ? { ...slot, winner: null }
        : slot
    ));
  };

  const confirmRemoveSelection = () => {
    if (slotToReroll && justification.trim()) {
      removeSelection(slotToReroll);
      setSlotToReroll(null);
      setJustification('');
    }
    setShowRerollWarning(false);
  };

  const handleManualSelection = (slotId: string) => {
    setManualSelectionSlot(slotId);
    setShowManualSelection(true);
    setSearchQuery('');
  };

  const selectParticipantManually = (participant: Participant) => {
    if (!manualSelectionSlot) return;

    const newWinner: SlotWinner = {
      participant,
      rolledAt: new Date().toISOString(),
      isConfirmed: false,
      rerollCount: 0,
      method: 'manual'
    };

    setSlots(prev => prev.map(slot =>
      slot.id === manualSelectionSlot
        ? { ...slot, winner: newWinner }
        : slot
    ));

    setShowManualSelection(false);
    setManualSelectionSlot(null);
  };


  const getSlotStatusBadge = (slot: PrizeSlot) => {
    if (slot.isRolling) {
      return <Badge variant="secondary" className="text-xs">Rolling...</Badge>;
    }
    if (!slot.winner) {
      return <Badge variant="outline" className="text-xs">Empty</Badge>;
    }
    if (slot.winner.isConfirmed) {
      return <Badge className="text-xs bg-green-500">Confirmed</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Rolled</Badge>;
  };


  const getMethodBadge = (method: SlotWinner['method']) => {
    switch (method) {
      case 'random':
        return <Badge variant="outline" className="text-xs">Random</Badge>;
      case 'manual':
        return <Badge variant="secondary" className="text-xs">Manual</Badge>;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-amber-600" />;
      default: return <Gift className="h-5 w-5 text-blue-500" />;
    }
  };

  const allConfirmed = slots.every(slot => slot.winner?.isConfirmed);
  const confirmedCount = slots.filter(slot => slot.winner?.isConfirmed).length;
  const eligibleCount = getEligibleParticipants().length;

  const getCriteriaSummary = () => {
    const criteria = [];
    if (winnerCriteria.minQualityScore > 0) criteria.push(`Quality ≥${winnerCriteria.minQualityScore}%`);
    if (winnerCriteria.minEngagement > 0) criteria.push(`Engagement ≥${winnerCriteria.minEngagement}%`);
    if (winnerCriteria.preventDuplicateWinners) criteria.push('No duplicate winners');
    if (winnerCriteria.bannedEmails.length > 0) criteria.push(`${winnerCriteria.bannedEmails.length} banned emails`);
    if (winnerCriteria.bannedDomains.length > 0) criteria.push(`${winnerCriteria.bannedDomains.length} banned domains`);
    return criteria;
  };

  return (
    <div className="space-y-6">
      {/* Winner Criteria Settings */}
      {!criteriaConfigured ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Configure Winner Criteria</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              Set the eligibility requirements for participants before rolling for winners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Minimum Quality Score (%)</Label>
                <Select
                  value={winnerCriteria.minQualityScore.toString()}
                  onValueChange={(value) => setWinnerCriteria(prev => ({ ...prev, minQualityScore: parseInt(value) }))}
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
                  onValueChange={(value) => setWinnerCriteria(prev => ({ ...prev, minEngagement: parseInt(value) }))}
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
                onChange={(e) => setWinnerCriteria(prev => ({ ...prev, preventDuplicateWinners: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="preventDuplicates">Prevent duplicate winners across all prizes</Label>
            </div>

            <Collapsible open={showCriteriaSettings} onOpenChange={setShowCriteriaSettings}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto font-normal text-sm">
                  <div className="flex items-center space-x-1">
                    {showCriteriaSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span>Advanced Settings (Banned emails/domains)</span>
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label>Banned Email Addresses (one per line)</Label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm resize-none rounded-md"
                    placeholder="example@domain.com&#10;spam@test.com"
                    value={winnerCriteria.bannedEmails.join('\n')}
                    onChange={(e) => setWinnerCriteria(prev => ({
                      ...prev,
                      bannedEmails: e.target.value.split('\n').filter(email => email.trim())
                    }))}
                  />
                </div>
                <div>
                  <Label>Banned Email Domains (one per line)</Label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm resize-none rounded-md"
                    placeholder="tempmail.com&#10;10minutemail.com"
                    value={winnerCriteria.bannedDomains.join('\n')}
                    onChange={(e) => setWinnerCriteria(prev => ({
                      ...prev,
                      bannedDomains: e.target.value.split('\n').filter(domain => domain.trim())
                    }))}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>{eligibleCount}</strong> of {participants.length} participants meet these criteria
              </div>
              <Button
                onClick={() => setCriteriaConfigured(true)}
                disabled={eligibleCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Criteria
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Summary Stats with Criteria */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shuffle className="h-5 w-5" />
                <span>Prize Slots</span>
                <Badge variant="secondary">{confirmedCount}/{slots.length} confirmed</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCriteriaConfigured(false)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Modify Criteria
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Settings className="h-4 w-4 mr-1" />
                  Manage Prizes
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Roll for each prize slot individually. You can reroll as many times as needed before confirming.
            </CardDescription>

            {getCriteriaSummary().length > 0 && (
              <div className="flex items-center space-x-2 mt-3 p-3 bg-muted rounded-lg">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Winner Criteria:</span>
                  <span className="ml-2">{getCriteriaSummary().join(' • ')}</span>
                  <span className="ml-2 text-muted-foreground">({eligibleCount} eligible participants)</span>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Prize Slots */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <Card key={slot.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPositionIcon(slot.position)}
                  <span className="font-semibold">Prize #{slot.position}</span>
                </div>
                {getSlotStatusBadge(slot)}
              </div>
              <CardTitle className="text-lg">{slot.prize}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Dice/Winner Display Area */}
              <div className="flex flex-col items-center justify-center min-h-[120px] p-4 border-2 border-dashed border-muted rounded-lg">
                {slot.isRolling ? (
                  <div className="text-center space-y-2">
                    <DiceIcon isRolling={true} />
                    <p className="text-sm text-muted-foreground">Rolling for winner...</p>
                  </div>
                ) : slot.winner ? (
                  <div className="space-y-3 w-full">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {slot.winner.participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-sm truncate">{slot.winner.participant.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(`/app/${activeTeam.slug}/users/user-${slot.winner!.participant.name.toLowerCase().replace(' ', '-')}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{slot.winner.participant.email}</div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <span>{slot.winner.participant.country}</span>
                          <span>•</span>
                          <span>{slot.winner.participant.entriesCount} entries</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Quality Score</span>
                          <span className="font-medium">{slot.winner.participant.qualityScore}/100</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              slot.winner.participant.qualityScore >= 80
                                ? 'bg-green-500'
                                : slot.winner.participant.qualityScore >= 60
                                  ? 'bg-yellow-500'
                                  : slot.winner.participant.qualityScore >= 40
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${slot.winner.participant.qualityScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Engagement</span>
                          <span className="font-medium">{slot.winner.participant.engagement}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              slot.winner.participant.engagement >= 80
                                ? 'bg-green-500'
                                : slot.winner.participant.engagement >= 60
                                  ? 'bg-blue-500'
                                  : slot.winner.participant.engagement >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${slot.winner.participant.engagement}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {getMethodBadge(slot.winner.method)}
                      {slot.winner.rerollCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Rerolled {slot.winner.rerollCount}x
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <DiceIcon isRolling={false} />
                    <p className="text-sm text-muted-foreground">A winner has not been chosen for this prize</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {!slot.winner ? (
                    <>
                      <Button
                        onClick={() => rollForSlot(slot.id)}
                        disabled={slot.isRolling || !criteriaConfigured}
                        className="flex-1"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Roll
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleManualSelection(slot.id)}
                        disabled={slot.isRolling || !criteriaConfigured}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </>
                  ) : slot.winner.isConfirmed ? (
                    <Button
                      variant="outline"
                      onClick={() => handleReroll(slot.id)}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Remove Selection
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleReroll(slot.id)}
                        disabled={slot.isRolling}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Pick Again
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

                {slot.winner && !slot.winner.isConfirmed && (
                  <p className="text-xs text-muted-foreground text-center">
                    Click "Confirm" to lock in this winner, or "Pick Again" to try again
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Always Visible Summary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {allConfirmed ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>All Winners Confirmed!</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Pending Selection</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {allConfirmed
              ? 'All prize slots have confirmed winners. You can now announce the results or export the winner list.'
              : `${confirmedCount} of ${slots.length} prizes have confirmed winners. You can roll individually or fill all empty slots at once.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {allConfirmed ? (
              <>
                <Button>
                  <Trophy className="h-4 w-4 mr-2" />
                  Announce Winners
                </Button>
                <Button variant="outline">
                  Export Winner List
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    // Roll all empty slots
                    slots.forEach(slot => {
                      if (!slot.winner && !slot.isRolling) {
                        rollForSlot(slot.id);
                      }
                    });
                  }}
                  disabled={slots.every(slot => slot.winner || slot.isRolling) || !criteriaConfigured}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Roll All Empty Slots
                </Button>
                <Button variant="outline">
                  Export Current Winners
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reroll Warning Dialog */}
      <AlertDialog open={showRerollWarning} onOpenChange={setShowRerollWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Remove Confirmed Winner?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              This slot already has a confirmed winner. Removing the selection will replace them with a new winner.
              Please provide a justification for this change:
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
            <AlertDialogAction onClick={confirmRemoveSelection} disabled={!justification.trim()}>
              Remove Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Selection Dialog */}
      <AlertDialog open={showManualSelection} onOpenChange={setShowManualSelection}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Manual Winner Selection</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Choose a participant manually for {manualSelectionSlot && slots.find(s => s.id === manualSelectionSlot)?.prize}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            {/* Search */}
            <div>
              <Label>Search Participants</Label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Participants List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {participants
                .filter(p => {
                  // Filter by search query
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(query) ||
                      p.email.toLowerCase().includes(query)
                    );
                  }
                  return true;
                })
                .filter(p => {
                  // Use same eligibility criteria as rolling
                  const eligibleIds = getEligibleParticipants().map(ep => ep.id);
                  return eligibleIds.includes(p.id);
                })
                .slice(0, 10) // Limit to 10 results
                .map(participant => (
                  <div
                    key={participant.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => selectParticipantManually(participant)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{participant.name}</div>
                        <div className="text-xs text-muted-foreground">{participant.email}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-xs text-muted-foreground">
                            Quality: {participant.qualityScore} • Engagement: {participant.engagement}% • {participant.country}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowManualSelection(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};