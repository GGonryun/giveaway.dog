'use client';

import React, { useState } from 'react';
import { Crown, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export const WinnersAnnounced: React.FC = () => {
  const { winners } = useGiveawayParticipation();
  const [showWinners, setShowWinners] = useState(false);

  const allWinners = winners.flatMap((prize) =>
    prize.winners.map((winner) => ({
      ...winner,
      prizeName: prize.prizeName
    }))
  );

  return (
    <div className="space-y-6 w-full">
      <div className="text-center">
        <div className="rounded-full bg-yellow-100 p-6 inline-block mb-4">
          <Crown className="h-12 w-12 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Winners Announced!</h3>
        <p className="text-muted-foreground text-lg mb-4">
          Congratulations to all the winners of this giveaway!
        </p>

        {allWinners && allWinners.length > 0 && (
          <Button
            onClick={() => setShowWinners(!showWinners)}
            variant="outline"
            size="lg"
            className="mt-2"
          >
            <Trophy className="h-4 w-4 mr-2" />
            {showWinners ? 'Hide Winners' : 'View All Winners'}
            {showWinners ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        )}
      </div>

      {showWinners && allWinners && allWinners.length > 0 && (
        <div className="w-full">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Won Via</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allWinners.map((winner, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {winner.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{winner.name}</div>
                          {winner.email && (
                            <div className="text-sm text-muted-foreground">
                              {winner.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {winner.prizeName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {winner.winningTaskName || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
