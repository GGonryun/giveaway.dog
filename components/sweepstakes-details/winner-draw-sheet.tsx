'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Shuffle,
  Trophy,
  RefreshCw,
  UserCheck,
  Crown,
  Award,
  Star,
  History
} from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';

import { TablePagination } from '@/components/ui/table-pagination';
import { SearchBar } from '../users/search-bar';
import { FilterBar } from '../users/filter-bar';

interface Winner {
  id: string;
  name: string;
  email: string;
  country: string;
  qualityScore: number;
  engagement: number;
  position: number;
  selectedAt: string;
  claimStatus: 'pending' | 'claimed' | 'unclaimed' | 'disqualified';
  prize: string;
  method: 'random' | 'manual' | 'reroll';
  rerollCount: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  country: string;
  qualityScore: number;
  engagement: number;
  lastEntryAt: string;
  entriesCount: number;
  status: 'active' | 'blocked';
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'draw' | 'reroll' | 'manual_select' | 'claim_update' | 'disqualify';
  details: string;
  winnerId?: string;
  position?: number;
}

interface WinnerDrawSheetProps {
  sweepstakesId: string;
  isOpen: boolean;
  onClose: () => void;
  winners: Winner[];
  onWinnersUpdate: (winners: Winner[]) => void;
}

// Mock participants data
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
    qualityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    engagement: Math.floor(Math.random() * 40) + 60, // 60-100
    lastEntryAt: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    entriesCount: Math.floor(Math.random() * 10) + 1,
    status: i % 10 === 0 ? 'blocked' : ('active' as const)
  }));
};

export const WinnerDrawSheet = ({
  sweepstakesId,
  isOpen,
  onClose,
  winners,
  onWinnersUpdate
}: WinnerDrawSheetProps) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [currentStep, setCurrentStep] = useState<
    'setup' | 'drawing' | 'results' | 'manual' | 'audit'
  >('setup');
  const [numberOfWinners, setNumberOfWinners] = useState(3);
  const [drawMethod, setDrawMethod] = useState<'random' | 'weighted'>('random');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempWinners, setTempWinners] = useState<Winner[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isIncrementalDraw, setIsIncrementalDraw] = useState(false);

  // Manual selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    minScore: 0,
    maxScore: 100,
    status: 'all',
    dateRange: 'all'
  });

  const participants = useMemo(() => generateMockParticipants(), []);
  const pageSize = 10;

  // Initialize component based on existing winners
  useEffect(() => {
    if (isOpen) {
      if (winners.length > 0) {
        setTempWinners([...winners]);
        setIsIncrementalDraw(true);
        setCurrentStep('results');
        setNumberOfWinners(winners.length + 1); // Default to adding 1 more winner
      } else {
        setTempWinners([]);
        setIsIncrementalDraw(false);
        setCurrentStep('setup');
        setNumberOfWinners(3);
      }
    }
  }, [isOpen, winners]);

  // Filter participants for manual selection
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter((p) => p.status === 'active');

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    filtered = filtered.filter(
      (p) =>
        p.qualityScore >= filters.minScore && p.qualityScore <= filters.maxScore
    );

    return filtered;
  }, [participants, searchQuery, filters]);

  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredParticipants.slice(start, end);
  }, [filteredParticipants, currentPage]);

  const totalPages = Math.ceil(filteredParticipants.length / pageSize);

  const addAuditEntry = (
    action: AuditLogEntry['action'],
    details: string,
    winnerId?: string,
    position?: number
  ) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      winnerId,
      position
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  const performRandomDraw = async () => {
    setIsDrawing(true);
    setCurrentStep('drawing');

    // Simulate drawing animation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const eligibleParticipants = participants.filter(
      (p) => p.status === 'active' && !tempWinners.some((w) => w.id === p.id) // Exclude already selected winners
    );

    let winnersToAdd: Winner[] = [];

    if (isIncrementalDraw) {
      // Add additional winners to existing ones
      const winnersToGenerate = numberOfWinners - tempWinners.length;

      for (let i = 0; i < winnersToGenerate; i++) {
        if (eligibleParticipants.length === 0) break;

        let selectedParticipant: Participant;

        if (drawMethod === 'weighted') {
          // Weighted selection based on entries count
          const weightedPool: Participant[] = [];
          eligibleParticipants.forEach((p) => {
            for (let j = 0; j < p.entriesCount; j++) {
              weightedPool.push(p);
            }
          });
          selectedParticipant =
            weightedPool[Math.floor(Math.random() * weightedPool.length)];
        } else {
          // Random selection
          selectedParticipant =
            eligibleParticipants[
              Math.floor(Math.random() * eligibleParticipants.length)
            ];
        }

        const newPosition = tempWinners.length + i + 1;
        const winner: Winner = {
          id: selectedParticipant.id,
          name: selectedParticipant.name,
          email: selectedParticipant.email,
          country: selectedParticipant.country,
          qualityScore: selectedParticipant.qualityScore,
          engagement: selectedParticipant.engagement,
          position: newPosition,
          selectedAt: new Date().toISOString(),
          claimStatus: 'pending',
          prize: `Prize ${newPosition}`,
          method: 'random',
          rerollCount: 0
        };

        winnersToAdd.push(winner);

        // Remove from eligible pool to avoid duplicates
        const index = eligibleParticipants.indexOf(selectedParticipant);
        if (index > -1) {
          eligibleParticipants.splice(index, 1);
        }
      }

      setTempWinners((prev) => [...prev, ...winnersToAdd]);
      addAuditEntry(
        'draw',
        `Added ${winnersToAdd.length} additional winners using ${drawMethod} method`
      );
    } else {
      // Fresh draw - create all winners from scratch
      for (let i = 0; i < numberOfWinners; i++) {
        if (eligibleParticipants.length === 0) break;

        let selectedParticipant: Participant;

        if (drawMethod === 'weighted') {
          // Weighted selection based on entries count
          const weightedPool: Participant[] = [];
          eligibleParticipants.forEach((p) => {
            for (let j = 0; j < p.entriesCount; j++) {
              weightedPool.push(p);
            }
          });
          selectedParticipant =
            weightedPool[Math.floor(Math.random() * weightedPool.length)];
        } else {
          // Random selection
          selectedParticipant =
            eligibleParticipants[
              Math.floor(Math.random() * eligibleParticipants.length)
            ];
        }

        const winner: Winner = {
          id: selectedParticipant.id,
          name: selectedParticipant.name,
          email: selectedParticipant.email,
          country: selectedParticipant.country,
          qualityScore: selectedParticipant.qualityScore,
          engagement: selectedParticipant.engagement,
          position: i + 1,
          selectedAt: new Date().toISOString(),
          claimStatus: 'pending',
          prize: `Prize ${i + 1}`,
          method: 'random',
          rerollCount: 0
        };

        winnersToAdd.push(winner);

        // Remove from eligible pool to avoid duplicates
        const index = eligibleParticipants.indexOf(selectedParticipant);
        if (index > -1) {
          eligibleParticipants.splice(index, 1);
        }
      }

      setTempWinners(winnersToAdd);
      addAuditEntry(
        'draw',
        `Initial draw completed with ${numberOfWinners} winners using ${drawMethod} method`
      );
    }

    setIsDrawing(false);
    setCurrentStep('results');
  };

  const confirmWinners = () => {
    onWinnersUpdate(tempWinners);
    onClose();
    addAuditEntry('draw', 'Winners confirmed and published');
  };

  const confirmPartialWinners = () => {
    // Confirm only the newly added winners, keep the draw open for more
    onWinnersUpdate(tempWinners);
    addAuditEntry('draw', 'Partial winners confirmed - draw continuing');
  };

  const rerollWinner = (position: number) => {
    const eligibleParticipants = participants.filter(
      (p) => p.status === 'active' && !tempWinners.some((w) => w.id === p.id)
    );

    if (eligibleParticipants.length === 0) return;

    const selectedParticipant =
      eligibleParticipants[
        Math.floor(Math.random() * eligibleParticipants.length)
      ];
    const oldWinner = tempWinners.find((w) => w.position === position);

    const newWinner: Winner = {
      id: selectedParticipant.id,
      name: selectedParticipant.name,
      email: selectedParticipant.email,
      country: selectedParticipant.country,
      qualityScore: selectedParticipant.qualityScore,
      engagement: selectedParticipant.engagement,
      position,
      selectedAt: new Date().toISOString(),
      claimStatus: 'pending',
      prize: `Prize ${position}`,
      method: 'reroll',
      rerollCount: (oldWinner?.rerollCount || 0) + 1
    };

    setTempWinners((prev) =>
      prev.map((w) => (w.position === position ? newWinner : w))
    );

    addAuditEntry(
      'reroll',
      `Winner rerolled for position ${position}: ${oldWinner?.name} → ${newWinner.name}`,
      newWinner.id,
      position
    );
  };

  const selectManualWinner = (participant: Participant) => {
    // Check if already selected
    if (tempWinners.some((w) => w.id === participant.id)) {
      return;
    }

    const newWinner: Winner = {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      country: participant.country,
      qualityScore: participant.qualityScore,
      engagement: participant.engagement,
      position: selectedPosition,
      selectedAt: new Date().toISOString(),
      claimStatus: 'pending',
      prize: `Prize ${selectedPosition}`,
      method: 'manual',
      rerollCount: 0
    };

    setTempWinners((prev) => {
      const updated = prev.filter((w) => w.position !== selectedPosition);
      return [...updated, newWinner].sort((a, b) => a.position - b.position);
    });

    addAuditEntry(
      'manual_select',
      `Manual winner selected for position ${selectedPosition}: ${participant.name}`,
      participant.id,
      selectedPosition
    );

    setCurrentStep('results');
  };

  const updateClaimStatus = (
    winnerId: string,
    status: Winner['claimStatus']
  ) => {
    const winner = tempWinners.find((w) => w.id === winnerId);
    if (!winner) return;

    setTempWinners((prev) =>
      prev.map((w) => (w.id === winnerId ? { ...w, claimStatus: status } : w))
    );

    addAuditEntry(
      'claim_update',
      `Claim status updated for ${winner.name}: ${status}`,
      winnerId,
      winner.position
    );
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Star className="h-4 w-4 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-blue-500" />;
    }
  };

  const getClaimStatusBadge = (status: Winner['claimStatus']) => {
    switch (status) {
      case 'claimed':
        return <Badge className="text-xs bg-green-500">Claimed</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        );
      case 'unclaimed':
        return (
          <Badge variant="secondary" className="text-xs">
            Unclaimed
          </Badge>
        );
      case 'disqualified':
        return (
          <Badge variant="destructive" className="text-xs">
            Disqualified
          </Badge>
        );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <div className="space-y-6">
            {isIncrementalDraw && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Incremental Drawing
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  You currently have {winners.length} winner
                  {winners.length !== 1 ? 's' : ''} selected. You can add more
                  winners to this giveaway.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="num-winners">
                  {isIncrementalDraw
                    ? 'Total Number of Winners'
                    : 'Number of Winners'}
                </Label>
                <Input
                  id="num-winners"
                  type="number"
                  min={isIncrementalDraw ? winners.length + 1 : 1}
                  max="20"
                  value={numberOfWinners}
                  onChange={(e) =>
                    setNumberOfWinners(parseInt(e.target.value) || 1)
                  }
                />
                {isIncrementalDraw && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently have {winners.length}, will add{' '}
                    {numberOfWinners - winners.length} more
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="draw-method">Drawing Method</Label>
                <Select
                  value={drawMethod}
                  onValueChange={(value: 'random' | 'weighted') =>
                    setDrawMethod(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Selection</SelectItem>
                    <SelectItem value="weighted">
                      Weighted by Entries
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {drawMethod === 'weighted'
                    ? 'Participants with more entries have higher chance'
                    : 'All participants have equal chance'}
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">
                  {isIncrementalDraw
                    ? `Ready to add ${numberOfWinners - winners.length} more winner${numberOfWinners - winners.length !== 1 ? 's' : ''}?`
                    : `Ready to draw ${numberOfWinners} winner${numberOfWinners !== 1 ? 's' : ''}?`}
                </p>
                <p className="text-sm text-muted-foreground">
                  From{' '}
                  {
                    participants.filter(
                      (p) =>
                        p.status === 'active' &&
                        !winners.some((w) => w.id === p.id)
                    ).length
                  }{' '}
                  eligible participants
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={performRandomDraw}
                  disabled={
                    isDrawing ||
                    (isIncrementalDraw && numberOfWinners <= winners.length)
                  }
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {isIncrementalDraw
                    ? 'Draw Additional Winners'
                    : 'Draw Winners'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('manual')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manual Selection
                </Button>
              </div>
            </div>
          </div>
        );

      case 'drawing':
        return (
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Drawing Winners...</h3>
              <p className="text-muted-foreground">
                Please wait while we randomly select winners
              </p>
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Selected Winners</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('manual')}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Manual Select
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('audit')}
                >
                  <History className="h-4 w-4 mr-1" />
                  Audit Log
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {tempWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPositionIcon(winner.position)}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {winner.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{winner.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {winner.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quality: {winner.qualityScore} • Engagement:{' '}
                          {winner.engagement}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getClaimStatusBadge(winner.claimStatus)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rerollWinner(winner.position)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reroll
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Position #{winner.position} • Method: {winner.method}
                      {winner.rerollCount > 0 &&
                        ` • Rerolled ${winner.rerollCount}x`}
                    </div>

                    <Select
                      value={winner.claimStatus}
                      onValueChange={(value: Winner['claimStatus']) =>
                        updateClaimStatus(winner.id, value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="claimed">Claimed</SelectItem>
                        <SelectItem value="unclaimed">Unclaimed</SelectItem>
                        <SelectItem value="disqualified">
                          Disqualified
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                {isIncrementalDraw ? 'Add More' : 'Start Over'}
              </Button>
              {isIncrementalDraw && (
                <Button variant="outline" onClick={confirmPartialWinners}>
                  Save & Continue
                </Button>
              )}
              <Button onClick={confirmWinners}>
                {isIncrementalDraw ? 'Finalize All Winners' : 'Confirm Winners'}
              </Button>
            </div>
          </div>
        );

      case 'manual':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manual Winner Selection</h3>
              <Button
                variant="outline"
                onClick={() => setCurrentStep('results')}
              >
                Back to Results
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Select Position</Label>
                <Select
                  value={selectedPosition.toString()}
                  onValueChange={(value) =>
                    setSelectedPosition(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: numberOfWinners }, (_, i) => {
                      const position = i + 1;
                      const isOccupied = tempWinners.some(
                        (w) => w.position === position
                      );
                      return (
                        <SelectItem key={position} value={position.toString()}>
                          Position {position} {isOccupied ? '(Occupied)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search participants..."
                  />
                </div>
                <FilterBar
                  filters={{
                    query: searchQuery,
                    minScore: filters.minScore,
                    maxScore: filters.maxScore,
                    status: filters.status,
                    dateRange: filters.dateRange
                  }}
                  onChange={(newFilters) =>
                    setFilters({
                      minScore: newFilters.minScore,
                      maxScore: newFilters.maxScore,
                      status: newFilters.status,
                      dateRange: newFilters.dateRange
                    })
                  }
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParticipants.map((participant) => {
                    const isSelected = tempWinners.some(
                      (w) => w.id === participant.id
                    );
                    return (
                      <TableRow
                        key={participant.id}
                        className={isSelected ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {participant.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {participant.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {participant.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{participant.qualityScore}</TableCell>
                        <TableCell>{participant.engagement}%</TableCell>
                        <TableCell>{participant.entriesCount}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={isSelected ? 'secondary' : 'outline'}
                            onClick={() => selectManualWinner(participant)}
                            disabled={isSelected}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TablePagination
                totalItems={filteredParticipants.length}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemName="participants"
                isPending={false}
              />
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Audit Log</h3>
              <Button
                variant="outline"
                onClick={() => setCurrentStep('results')}
              >
                Back to Results
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {entry.action.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {entry.details}
                  </div>
                  {entry.position && (
                    <div className="text-xs text-blue-600 mt-1">
                      Position: {entry.position}
                    </div>
                  )}
                </div>
              ))}
              {auditLog.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No actions recorded yet
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Winner Management</span>
          </SheetTitle>
          <SheetDescription>
            Draw winners, manage selections, and track claim status
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6">{renderStepContent()}</div>
      </SheetContent>
    </Sheet>
  );
};
