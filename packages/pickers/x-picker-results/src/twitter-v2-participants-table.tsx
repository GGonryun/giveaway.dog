'use client';

import React, { useState } from 'react';
import { Badge } from '@giveaway/ui-primitives/badge';
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
import { ExternalLink, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@giveaway/ui-primitives/tooltip';
import { TwitterV2PickerUserSchema } from '@giveaway/x-picker-model/schemas/details';

interface TwitterV2ParticipantsTableProps {
  participants: TwitterV2PickerUserSchema[];
}

const ParticipantRow: React.FC<{
  participant: TwitterV2PickerUserSchema;
}> = ({ participant }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const isIneligible = Boolean(participant.ineligible);

  return (
    <TableRow
      className={cn(
        isIneligible
          ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30'
          : 'hover:bg-muted/50'
      )}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.profileImageUrl ?? undefined} />
            <AvatarFallback>
              {(participant.name || 'U').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {participant.name}
              {participant.verified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              @{participant.username}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isIneligible ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <TooltipTrigger asChild>
                <button
                  className="inline-block"
                  onClick={() => setTooltipOpen(!tooltipOpen)}
                >
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Filtered
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-destructive text-destructive-foreground border-destructive"
                arrowClassName="bg-destructive text-destructive-foreground fill-destructive"
              >
                <p className="text-xs">{participant.ineligible}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge className="text-xs bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Eligible
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <a
          href={`https://x.com/${participant.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </TableCell>
    </TableRow>
  );
};

export const TwitterV2ParticipantsTable: React.FC<
  TwitterV2ParticipantsTableProps
> = ({ participants }) => {
  if (participants.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No participants found
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
          <TableHead className="w-12.5"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <ParticipantRow key={participant.id} participant={participant} />
        ))}
      </TableBody>
    </Table>
  );
};
