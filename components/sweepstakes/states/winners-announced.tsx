'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export const WinnersAnnounced: React.FC = () => {
  const { prizes: winners } = useGiveawayParticipation();

  const allWinners = winners.flatMap((prize) =>
    prize.winners.map((winner) => ({
      ...winner,
      prizeName: prize.prizeName
    }))
  );

  return (
    <div className="space-y-6 w-full mt-2">
      <div className="text-center">
        <div className="rounded-full bg-yellow-100 p-6 inline-block mb-2">
          <Crown className="h-12 w-12 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold">Winners Announced!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Congratulations to all the winners of this giveaway!
        </p>

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
                    <TableCell align="left" className="font-medium">
                      {winner.name}
                    </TableCell>
                    <TableCell align="left" className="text-muted-foreground">
                      {winner.prizeName}
                    </TableCell>
                    <TableCell align="left" className="text-muted-foreground">
                      {winner.winningTaskName || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
