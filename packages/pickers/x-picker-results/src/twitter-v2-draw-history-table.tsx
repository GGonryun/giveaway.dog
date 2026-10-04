'use client';

import React from 'react';
import { Badge } from '@giveaway/ui-primitives/badge';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@giveaway/ui-primitives/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import { Trophy, Ban, ExternalLink } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import {
  TwitterV2PickerDrawSchema,
  TwitterV2PickerUserSchema
} from '@giveaway/x-picker-model/schemas/details';

interface DrawHistoryEntry {
  draw: TwitterV2PickerDrawSchema;
  user: TwitterV2PickerUserSchema;
}

interface TwitterV2DrawHistoryTableProps {
  entries: DrawHistoryEntry[];
  onViewReason?: (winnerName: string, reason: string) => void;
  isComplete: boolean;
}

const DrawHistoryRow: React.FC<{
  entry: DrawHistoryEntry;
  onViewReason?: (winnerName: string, reason: string) => void;
}> = ({ entry, onViewReason }) => {
  const { draw, user } = entry;
  const isRerolled = Boolean(draw.disqualified);

  return (
    <TableRow
      className={cn(
        isRerolled
          ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30'
          : 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30'
      )}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className={cn('h-8 w-8', isRerolled && 'opacity-50')}>
            <AvatarImage src={user.profileImageUrl ?? undefined} />
            <AvatarFallback>
              {(user.name || 'U').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p
              className={cn(
                'text-sm font-medium',
                isRerolled && 'line-through text-muted-foreground'
              )}
            >
              {user.name}
              {user.verified && !isRerolled && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isRerolled ? (
          <Badge
            variant="destructive"
            className="text-xs w-[95px] justify-between"
          >
            <Ban className="h-3 w-3" />
            Rerolled
          </Badge>
        ) : (
          <Badge className="text-xs w-[95px] justify-between bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 dark:text-yellow-400">
            <Trophy className="h-3 w-3" />
            Winner
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isRerolled ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() =>
              onViewReason?.(
                user.name || user.username || 'User',
                draw.disqualified || 'No reason provided'
              )
            }
          >
            <Ban className="h-3 w-3 mr-1" />
            View Reason
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <a
              href={`https://x.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Profile
            </a>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export const TwitterV2DrawHistoryTable: React.FC<
  TwitterV2DrawHistoryTableProps
> = ({ entries, onViewReason, isComplete }) => {
  if (entries.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {isComplete
                  ? 'No draw history found'
                  : 'Winners will appear here once the draw is complete'}
              </p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead className="text-right">Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <DrawHistoryRow
            key={entry.draw.id}
            entry={entry}
            onViewReason={onViewReason}
          />
        ))}
      </TableBody>
    </Table>
  );
};
