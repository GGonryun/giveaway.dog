'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  ChevronRight,
  History,
  Trophy,
  XCircle
} from 'lucide-react';
import { PickerDrawSchema } from '../schemas/draws';
import { PickerDrawResult } from '@prisma/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PickerDrawHistoryProps {
  draws: PickerDrawSchema[];
  showCard?: boolean;
}

export const PickerDrawHistory: React.FC<PickerDrawHistoryProps> = ({
  draws,
  showCard = true
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (drawId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(drawId)) {
        next.delete(drawId);
      } else {
        next.add(drawId);
      }
      return next;
    });
  };

  const sortedDraws = [...draws].sort((a, b) => b.drawNumber - a.drawNumber);

  if (draws.length === 0) {
    return null;
  }

  const tableContent = (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Draw #</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDraws.map((draw) => {
            const isExpanded = expandedRows.has(draw.drawId);
            const isDisqualified =
              draw.result === PickerDrawResult.DISQUALIFIED;
            const hasJustification = Boolean(draw.disqualificationReason);

            return (
              <React.Fragment key={draw.drawId}>
                <TableRow
                  className={cn(
                    hasJustification ? 'cursor-pointer hover:bg-muted/50' : ''
                  )}
                  onClick={() =>
                    hasJustification ? toggleRow(draw.drawId) : null
                  }
                >
                  <TableCell>
                    {hasJustification && (
                      <button
                        className="p-1 hover:bg-muted rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(draw.drawId);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    #{draw.drawNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={draw.winner.profile_image_url ?? undefined}
                        />
                        <AvatarFallback>
                          {(draw.winner.name || 'U')
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {draw.winner.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{draw.winner.username || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isDisqualified ? (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 w-fit"
                      >
                        <XCircle className="h-3 w-3" />
                        Disqualified
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="flex items-center gap-1 w-fit bg-green-500 hover:bg-green-600"
                      >
                        <Trophy className="h-3 w-3" />
                        Winner
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">#{draw.winner.position}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(draw.drawnAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                </TableRow>
                {isExpanded && hasJustification && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30">
                      <div className="py-3 px-2">
                        <div className="flex gap-2">
                          <div className="mt-0.5">
                            <XCircle className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              Disqualification Reason
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {draw.disqualificationReason}
                            </p>
                            {draw.previousDrawId && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Replaced by draw #
                                {draws.find(
                                  (d) => d.drawId === draw.previousDrawId
                                )?.drawNumber || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (!showCard) {
    return tableContent;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Draw History</CardTitle>
        </div>
        <CardDescription>
          Complete history of all draws including disqualifications
        </CardDescription>
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
};
