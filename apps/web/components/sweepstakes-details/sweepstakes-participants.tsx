'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, UserX, Users, Ban } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

import { DEFAULT_PAGE_SIZE } from '@giveaway/app-config/settings';
import { datetime } from '@/lib/date';

import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { UserSourceCaption } from '@/lib/user-source/components/user-source-caption';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { toSweepstakesEngagement } from '@/lib/participant/db';
import { toMostRecentCompletion } from '@/lib/task/completions';
import { toEngagementTheme } from '@/lib/participant/util';
import {
  toQualityType,
  QUALITY_LABELS
} from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@/lib/user-quality/display';
import { useProcedure } from '@/lib/mrpc/hook';
import { disqualifyParticipant } from '@/procedures/sweepstakes/disqualify-participant';

const useDisqualifyParticipant = () => {
  const router = useRouter();

  return useProcedure({
    action: disqualifyParticipant,
    onSuccess: () => {
      router.refresh();
    }
  });
};

export const SweepstakesParticipants: React.FC<{
  slug: string;
  sweepstakesId: string;
  totalTasks: number;
  participants: SweepstakesParticipantSchema[];
}> = ({ participants, slug, sweepstakesId, totalTasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [disqualifyDialogOpen, setDisqualifyDialogOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [selectedParticipantName, setSelectedParticipantName] =
    useState<string>('');
  const [disqualificationReason, setDisqualificationReason] = useState('');

  const disqualifyParticipantProcedure = useDisqualifyParticipant();

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalParticipants = participants.length;
  const totalPages = Math.ceil(totalParticipants / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDisqualifyParticipant = (
    participant: SweepstakesParticipantSchema
  ) => {
    setSelectedParticipantId(participant.id);
    setSelectedParticipantName(participant.user.name || 'Unknown User');
    setDisqualificationReason('');
    setDisqualifyDialogOpen(true);
  };

  const handleDisqualifySubmit = () => {
    if (!selectedParticipantId || !disqualificationReason.trim()) return;

    disqualifyParticipantProcedure.run({
      sweepstakesId,
      participantId: selectedParticipantId,
      disqualificationReason
    });

    setDisqualifyDialogOpen(false);
    setSelectedParticipantId(null);
    setDisqualificationReason('');
  };

  // Calculate shown entries for pagination
  const startEntry = (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalParticipants);
  const paginatedParticipants = participants.slice(startEntry - 1, endEntry);

  return (
    <div>
      <div className="w-full space-y-4">
        <div>
          <Card className="p-0 overflow-hidden">
            <CardHeader hidden>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="text-lg font-semibold">Participants</span>
                  <Badge variant="secondary">
                    {totalParticipants.toLocaleString()} total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Participants who have entered this sweepstake.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Quality
                      </TableHead>
                      <TableHead className="hidden xl:table-cell text-right">
                        Engagement
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-right">
                        Last Entry
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParticipants.map((participant) => (
                      <SweepstakeParticipant
                        key={participant.id}
                        slug={slug}
                        sweepstakesId={sweepstakesId}
                        totalTasks={totalTasks}
                        participant={participant}
                        onDisqualify={handleDisqualifyParticipant}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                totalItems={totalParticipants}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName="participants"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
        }}
        status="active"
      />

      {/* Disqualify Participant Dialog */}
      <Dialog
        open={disqualifyDialogOpen}
        onOpenChange={setDisqualifyDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disqualify Participant</DialogTitle>
            <DialogDescription>
              This will reject all task completions for{' '}
              <span className="font-semibold">{selectedParticipantName}</span>{' '}
              in this sweepstakes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disqualification-reason">
                Disqualification Reason (required)
              </Label>
              <Textarea
                id="disqualification-reason"
                placeholder="Enter the reason for disqualifying this participant..."
                value={disqualificationReason}
                onChange={(e) => setDisqualificationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisqualifyDialogOpen(false)}
              disabled={disqualifyParticipantProcedure.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisqualifySubmit}
              disabled={
                !disqualificationReason.trim() ||
                disqualifyParticipantProcedure.isLoading
              }
            >
              {disqualifyParticipantProcedure.isLoading
                ? 'Disqualifying...'
                : 'Disqualify Participant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SweepstakeParticipant: React.FC<{
  slug: string;
  sweepstakesId: string;
  participant: SweepstakesParticipantSchema;
  totalTasks: number | null;
  onDisqualify: (participant: SweepstakesParticipantSchema) => void;
}> = ({ sweepstakesId, slug, participant, totalTasks, onDisqualify }) => {
  const router = useRouter();

  const engagement = toSweepstakesEngagement(
    participant.completions,
    totalTasks
  );
  const lastEntryAt = toMostRecentCompletion(participant.completions);
  return (
    <TableRow
      key={participant.user.id}
      className={'cursor-pointer hover:bg-muted/50'}
      onClick={() => {
        router.push(
          `/app/${slug}/sweepstakes/${sweepstakesId}/participants/${participant.user.id}`
        );
      }}
    >
      <TableCell>
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center gap-1">
              <UserSourceBadge source={participant.user.source} />
              <div className="font-medium text-sm">{participant.user.name}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              <UserSourceCaption user={participant.user} />
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-right">
        <Badge
          variant={
            QUALITY_BADGE_VARIANT[toQualityType(participant.user.qualityScore)]
          }
        >
          {QUALITY_LABELS[toQualityType(participant.user.qualityScore)]}
        </Badge>
      </TableCell>
      <TableCell className="hidden xl:table-cell text-right">
        <div className="flex items-center justify-end space-x-2">
          <div className="w-16 bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${toEngagementTheme(
                engagement
              )}`}
              style={{ width: `${engagement}%` }}
            />
          </div>
          <span className="text-xs font-medium min-w-[2.5rem]">
            {engagement}%
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right">
        {lastEntryAt ? (
          <div className="text-sm">{datetime.format(lastEntryAt, 'tiny')}</div>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={4}
            avoidCollisions={true}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/app/${slug}/users/${participant.user.id}`);
              }}
            >
              <Eye />
              View Full Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/app/${slug}/sweepstakes/${sweepstakesId}/participants/${participant.user.id}`
                );
              }}
            >
              <Eye />
              Quick View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDisqualify(participant);
              }}
            >
              <Ban />
              Disqualify Participant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
