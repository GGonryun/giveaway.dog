'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Trophy } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const WinnersAnnounced: React.FC = () => {
  const { winners } = useGiveawayParticipation();

  return (
    <Card className="text-center">
      <CardContent className="p-8">
        <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-semibold mb-2">Winners Announced!</h3>
        <p className="text-muted-foreground mb-6">
          This giveaway has ended and winners have been selected.
        </p>

        {winners && winners.length > 0 && (
          <div className="space-y-4 text-left">
            {winners.map((prize, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{prize.prizeName}</h4>
                <div className="space-y-2">
                  {prize.winners.map((winner, winnerIndex) => (
                    <div key={winnerIndex} className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{winner.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
