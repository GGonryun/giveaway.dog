'use client';

import React, { useState, useMemo } from 'react';
import { Crown, ChevronDown, ChevronRight } from 'lucide-react';
import { useGiveawayParticipation } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@giveaway/ui-primitives/collapsible';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import { PrizeDrawResult } from '@prisma/client';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import { DisqualificationDialog } from '@giveaway/sweepstakes-ui/disqualification-dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';

export const WinnersAnnounced: React.FC = () => {
  const { prizes, participant } = useGiveawayParticipation();

  const [openPrizes, setOpenPrizes] = useState<Record<string, boolean>>({});
  const [disqualificationDialog, setDisqualificationDialog] = useState(false);
  const [selectedDisqualification, setSelectedDisqualification] = useState<{
    name: string;
    reason: string;
  } | null>(null);

  const allocation = useMemo(() => {
    return participant?.allocation;
  }, [participant]);

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

  const userWinStatus = useMemo(() => {
    if (!participant || !allocation) return null;

    const allocatedPrize = prizes.find(
      (p) => p.prizeId === allocation.prize.id
    );
    if (!allocatedPrize) return null;

    const userDraw = allocatedPrize.draws.find(
      (d) => d.user.id === participant.user.id
    );

    if (!userDraw) {
      return { type: 'competed', prize: allocation.prize.name };
    }

    if (userDraw.result === PrizeDrawResult.WINNER) {
      return { type: 'won', prize: allocation.prize.name };
    }

    if (userDraw.result === PrizeDrawResult.DISQUALIFIED) {
      return {
        type: 'disqualified',
        prize: allocation.prize.name,
        reason: userDraw.disqualificationReason
      };
    }

    return { type: 'competed', prize: allocation.prize.name };
  }, [participant, allocation, prizes]);

  return (
    <div className="space-y-4 w-full mt-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-yellow-100 p-3">
          <Crown className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-bold">Winners Announced!</h3>
          <p className="text-sm text-muted-foreground">
            Congratulations to all the winners of this giveaway!
          </p>
        </div>
      </div>

      {userWinStatus && (
        <Alert
          variant={
            userWinStatus.type === 'won'
              ? 'default'
              : userWinStatus.type === 'disqualified'
                ? 'destructive'
                : 'default'
          }
        >
          <AlertTitle>
            {userWinStatus.type === 'won' && (
              <>
                🎉 Congratulations! You won{' '}
                <span className="font-semibold">{userWinStatus.prize}</span>!
              </>
            )}
            {userWinStatus.type === 'disqualified' && (
              <>
                You were disqualified from{' '}
                <span className="font-semibold">{userWinStatus.prize}</span>
              </>
            )}
            {userWinStatus.type === 'competed' && (
              <>
                You competed for{' '}
                <span className="font-semibold">{userWinStatus.prize}</span>
              </>
            )}
          </AlertTitle>
          {userWinStatus.type === 'disqualified' && userWinStatus.reason && (
            <AlertDescription>Reason: {userWinStatus.reason}</AlertDescription>
          )}
          {userWinStatus.type === 'competed' && (
            <AlertDescription>
              Unfortunately, you didn't win this time. Better luck next time!
            </AlertDescription>
          )}
        </Alert>
      )}

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
