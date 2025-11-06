'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Trophy, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface Winner {
  id: string;
  drawId: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  position: number;
  selectedAt: Date;
}

interface Draw {
  id: string;
  pickerId: string;
  drawNumber: number;
  drawnAt: Date;
  numberOfWinners: number;
  eligibleEntries: number;
  verificationHash: string;
  winners?: Winner[];
}

interface PickerDrawHistorySheetProps {
  draws: Draw[];
}

export const PickerDrawHistorySheet: React.FC<PickerDrawHistorySheetProps> = ({
  draws
}) => {
  if (!draws || draws.length === 0) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Draw History ({draws.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Draw History</SheetTitle>
          <SheetDescription>
            View all previous winner draws for this picker
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {draws.map((draw) => (
            <div key={draw.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Draw #{draw.drawNumber}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(draw.drawnAt, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span>{draw.numberOfWinners} winners</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{draw.eligibleEntries} eligible</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {draw.winners?.map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    {winner.twitterProfileImageUrl && (
                      <img
                        src={winner.twitterProfileImageUrl}
                        alt={winner.twitterDisplayName}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    {!winner.twitterProfileImageUrl && (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {winner.twitterDisplayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          #{winner.position}
                        </Badge>
                        <p className="text-sm font-medium truncate">
                          {winner.twitterDisplayName}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @{winner.twitterUsername}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                <code className="font-mono">{draw.verificationHash}</code>
              </div>

              <Separator />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
