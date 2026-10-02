import React, { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeftIcon,
  ChevronDown,
  ChevronUp,
  SquareIcon,
  StarIcon,
  Trophy,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import pluralize from 'pluralize';
import { Prize } from '@/schemas/giveaway/schemas';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SweepstakesLoginOptions } from '../../sweepstakes-login-options';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { AllocationStatisticsSchema } from '@/lib/allocation/schemas';
import { Progress } from '@/components/ui/progress';

export const PrizeItem: React.FC<{
  prize: Prize;
  isConnected: boolean;
  open: boolean;
  state: 'allocation' | 'allocated' | 'allocating' | 'unallocated';
  allocations: AllocationStatisticsSchema | undefined;
  onToggleExpand?: () => void;
  onAllocate?: () => void;
  onSeeTasks?: () => void;
}> = ({
  prize,
  open,
  state,
  isConnected,
  allocations,
  onToggleExpand,
  onAllocate,
  onSeeTasks
}) => {
  const winnersText = `${prize.quota} ${pluralize('winner', prize.quota)}`;

  const isAllocating = state === 'allocating';
  const isAllocation = state === 'allocation';
  const isAllocated = state === 'allocated';

  // Get popularity metrics from allocations
  const prizeAllocation = allocations?.allocationsByPrize.find(
    (a) => a.prizeId === prize.id
  );

  const allocationCount = prizeAllocation?.allocationCount ?? 0;
  const totalAllocations = allocations?.totalAllocations ?? 0;
  const popularityPercentage =
    totalAllocations > 0 ? (allocationCount / totalAllocations) * 100 : 0;

  // Use badge from backend calculations
  const badge = prizeAllocation?.badge ?? 'none';
  const isMostPopular = badge === 'popular';
  const isLeastPopular = badge === 'unpopular';

  const prizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && prizeRef.current) {
      prizeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [open]);

  return (
    <Collapsible
      ref={prizeRef}
      open={open}
      onOpenChange={onToggleExpand}
      className={cn(
        'rounded-sm border transition-colors bg-sidebar overflow-hidden relative shadow-sm',
        open ? 'z-50 shadow-xl' : '',
        isAllocation
          ? 'border-amber-500 hover:border-amber-600'
          : isAllocated
            ? open
              ? ''
              : 'opacity-70'
            : null
      )}
    >
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'group flex items-stretch w-full cursor-pointer ',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center min-w-8 w-11 h-full bg-amber-100 text-amber-600'
              )}
            >
              <Trophy className="h-6 w-6" />
            </div>
          </div>
          <div className="px-2 py-2 gap-2 flex items-center justify-between w-full flex-wrap">
            <div className="text-left flex items-center gap-2">
              <h4 className="font-medium text-sm sm:text-base">{prize.name}</h4>
              {isMostPopular && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
              {isLeastPopular && (
                <TrendingDown className="h-4 w-4 text-orange-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-xs border font-bold">
                {winnersText}
              </Badge>
              {open ? <ChevronUp /> : <ChevronDown />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t bg-muted/50">
        {!isConnected ? (
          <div className="p-4 flex items-center justify-center mb-2">
            <SweepstakesLoginOptions />
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()} className="p-4 space-y-3">
            <div>
              <h5 className="font-semibold text-sm mb-1">Prize Details</h5>
              <p className="text-sm text-muted-foreground">
                {winnersText} will receive this prize
              </p>
            </div>

            {totalAllocations > 0 && (
              <div className="space-y-2">
                {(isMostPopular || isLeastPopular) && (
                  <div className="flex items-center gap-2">
                    {isMostPopular && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                    {isLeastPopular && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Best Odds
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Popularity</span>
                  <span className="text-muted-foreground">
                    ({allocationCount}/{totalAllocations}){' '}
                    {popularityPercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={popularityPercentage} className="h-2" />
              </div>
            )}

            {onAllocate && (
              <>
                {isAllocation ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={onSeeTasks}
                  >
                    <ArrowLeftIcon />
                    Complete Tasks to Win
                  </Button>
                ) : (
                  <Button
                    onClick={onAllocate}
                    className="w-full"
                    variant="warning"
                    size="sm"
                    disabled={isAllocating}
                  >
                    {isAllocating ? <Spinner /> : <StarIcon />}
                    {isAllocating ? 'Selecting...' : 'Select This Prize'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
