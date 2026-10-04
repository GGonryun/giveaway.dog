'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@giveaway/ui-utils/utils';
import { ChevronDown, Trophy } from 'lucide-react';
import pluralize from 'pluralize';
import { useState } from 'react';
import { TwitterV2DrawHistoryTable } from './twitter-v2-draw-history-table';
import {
  TwitterV2PickerDrawSchema,
  TwitterV2PickerUserSchema
} from '../schemas/details';

interface TwitterV2DrawHistorySectionProps {
  draws: TwitterV2PickerDrawSchema[];
  users: TwitterV2PickerUserSchema[];
  onViewReason?: (winnerName: string, reason: string) => void;
  isComplete: boolean;
}

export const TwitterV2DrawHistorySection = ({
  draws,
  users,
  onViewReason,
  isComplete
}: TwitterV2DrawHistorySectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showRerolled, setShowRerolled] = useState(false);

  const entries = draws
    .map((draw) => {
      const user = users.find((u) => u.id === draw.userId);
      return user ? { draw, user } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const winners = entries.filter((e) => !e.draw.disqualified);
  const rerolled = entries.filter((e) => e.draw.disqualified);
  const filteredEntries = showRerolled ? entries : winners;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" />
                Draw History
                <Badge variant="secondary" className="ml-2">
                  {winners.length} {pluralize('winner', winners.length)}
                  {rerolled.length > 0 && ` • ${rerolled.length} rerolled`}
                </Badge>
              </CardTitle>

              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 mt-2">
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-rerolled"
                  checked={showRerolled}
                  onCheckedChange={setShowRerolled}
                />
                <Label
                  htmlFor="show-rerolled"
                  className="text-sm cursor-pointer"
                >
                  Show Rerolled Users
                </Label>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <TwitterV2DrawHistoryTable
                entries={filteredEntries}
                onViewReason={onViewReason}
                isComplete={isComplete}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
