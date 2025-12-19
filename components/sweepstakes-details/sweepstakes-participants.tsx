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
import { MoreVertical, Eye, UserX, Users } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';

import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { datetime } from '@/lib/date';

import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { UserSourceCaption } from '@/lib/user-source/components/user-source-caption';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { toSweepstakesEngagement } from '@/lib/participant/db';
import { toMostRecentCompletion } from '@/lib/task/completions';
import { toEngagementTheme, toQualityTheme } from '@/lib/participant/util';

export const SweepstakesParticipants: React.FC<{
  slug: string;
  sweepstakesId: string;
  totalTasks: number;
  participants: SweepstakesParticipantSchema[];
}> = ({ participants, slug, sweepstakesId, totalTasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalParticipants = participants.length;
  const totalPages = Math.ceil(totalParticipants / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    </div>
  );
};

const SweepstakeParticipant: React.FC<{
  slug: string;
  sweepstakesId: string;
  participant: SweepstakesParticipantSchema;
  totalTasks: number | null;
}> = ({ sweepstakesId, slug, participant, totalTasks }) => {
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
        <div className="flex items-center justify-end space-x-2">
          <div className="w-16 bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${toQualityTheme(
                participant.user.qualityScore
              )}`}
              style={{
                width: `${participant.user.qualityScore}%`
              }}
            />
          </div>
          <span className="text-xs font-medium min-w-[2rem]">
            {participant.user.qualityScore}
          </span>
        </div>
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
              onClick={() => {
                alert('Block user action');
              }}
            >
              <UserX />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
