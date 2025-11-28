import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import pluralize from 'pluralize';
import { Prize } from '@/schemas/giveaway/schemas';

export const PrizeItem: React.FC<{
  prize: Prize;
}> = ({ prize }) => {
  const winnersText = `${prize.quota} ${pluralize('winner', prize.quota)}`;

  return (
    <div
      className={cn(
        'rounded-sm border transition-colors bg-sidebar overflow-hidden'
      )}
    >
      <div className="group flex items-stretch justify-between w-full">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={cn(
              'flex items-center justify-center min-w-8 w-11 h-full bg-amber-100 text-amber-600'
            )}
          >
            <Trophy className="h-6 w-6" />
          </div>
          <div className="text-left py-3">
            <h4 className="font-medium text-sm sm:text-base">{prize.name}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5">
          <Badge variant="warning" className="text-xs border font-bold">
            {winnersText}
          </Badge>
        </div>
      </div>
    </div>
  );
};
