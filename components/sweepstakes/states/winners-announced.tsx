'use client';

import React, { useState } from 'react';
import { Crown, ChevronDown, ChevronRight } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { UNKNOWN_USER_NAME } from '@/lib/settings';
import { PrizeDrawResult } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisqualificationDialog } from '@/components/sweepstakes-details/disqualification-dialog';

export const WinnersAnnounced: React.FC = () => {
  const { prizes } = useGiveawayParticipation();
  const [openPrizes, setOpenPrizes] = useState<Record<string, boolean>>({});
  const [disqualificationDialog, setDisqualificationDialog] = useState(false);
  const [selectedDisqualification, setSelectedDisqualification] = useState<{
    name: string;
    reason: string;
  } | null>(null);

  const togglePrize = (prizeId: string) => {
    setOpenPrizes((prev) => ({
      ...prev,
      [prizeId]: !prev[prizeId]
    }));
  };

  const handleShowDisqualification = (name: string, reason: string | null) => {
    setSelectedDisqualification({
      name,
      reason: reason || 'No reason provided'
    });
    setDisqualificationDialog(true);
  };

  return (
    <div className="space-y-6 w-full mt-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-yellow-100 p-4">
          <Crown className="h-8 w-8 text-yellow-600" />
        </div>
        <div className="text-left">
          <h3 className="text-xl font-bold">Winners Announced!</h3>
          <p className="text-sm text-muted-foreground">
            Congratulations to all the winners of this giveaway!
          </p>
        </div>
      </div>

      <DisqualificationDialog
        open={disqualificationDialog}
        onOpenChange={setDisqualificationDialog}
        participantName={selectedDisqualification?.name || null}
        disqualificationReason={selectedDisqualification?.reason || null}
      />

      <div className="w-full space-y-2">
        {prizes.map((prize) => {
          const winners = prize.draws.filter(
            (d) => d.result === PrizeDrawResult.WINNER
          );
          const disqualified = prize.draws.filter(
            (d) => d.result === PrizeDrawResult.DISQUALIFIED
          );
          const isOpen = openPrizes[prize.prizeId] || false;

          return (
            <Collapsible
              key={prize.prizeId}
              open={isOpen}
              onOpenChange={() => togglePrize(prize.prizeId)}
            >
              <div className="rounded-lg border bg-card">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-lg">
                        {prize.prizeName}
                      </span>
                      <Badge variant="secondary">
                        {winners.length}{' '}
                        {winners.length === 1 ? 'winner' : 'winners'}
                      </Badge>
                      {disqualified.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {disqualified.length} disqualified
                        </Badge>
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Won Via</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {winners.map((draw) => (
                          <TableRow key={draw.id}>
                            <TableCell className="font-medium">
                              {draw.user.name || UNKNOWN_USER_NAME}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {draw.task.title || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">Winner</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {disqualified.map((draw) => (
                          <TableRow key={draw.id} className="bg-muted/30">
                            <TableCell className="font-medium text-muted-foreground">
                              {draw.user.name || UNKNOWN_USER_NAME}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {draw.task.title || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowDisqualification(
                                    draw.user.name || UNKNOWN_USER_NAME,
                                    draw.disqualificationReason
                                  );
                                }}
                              >
                                <Badge
                                  variant="destructive"
                                  className="cursor-pointer hover:bg-destructive/80"
                                >
                                  Disqualified
                                </Badge>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
