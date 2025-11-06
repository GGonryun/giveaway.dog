'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EligibleTwitterUser } from '@/lib/integrations/schemas/api';
import { ExternalLink, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface PickerParticipantsTableProps {
  participants: EligibleTwitterUser[];
}

export const PickerParticipantsTable: React.FC<
  PickerParticipantsTableProps
> = ({ participants }) => {
  if (participants.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
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
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => {
          const isIneligible = Boolean(participant.ineligible);

          return (
            <TableRow
              key={participant.id}
              className={cn(
                isIneligible
                  ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                  : 'hover:bg-muted/50'
              )}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={participant.profile_image_url ?? undefined}
                    />
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
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Filtered
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      className="bg-destructive text-destructive-foreground fill-destructive"
                      arrowClassName="bg-destructive text-destructive-foreground fill-destructive"
                    >
                      {participant.ineligible}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Badge variant="success">
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
        })}
      </TableBody>
    </Table>
  );
};
