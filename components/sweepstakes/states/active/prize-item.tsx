import React, { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeftIcon,
  ChevronDown,
  ChevronUp,
  SquareIcon,
  StarIcon,
  Trophy
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

export const PrizeItem: React.FC<{
  prize: Prize;
  isConnected: boolean;
  open: boolean;
  state: 'allocation' | 'allocated' | 'allocating' | 'unallocated';
  onToggleExpand?: () => void;
  onAllocate?: () => void;
  onSeeTasks?: () => void;
}> = ({
  prize,
  open,
  state,
  isConnected,
  onToggleExpand,
  onAllocate,
  onSeeTasks
}) => {
  const winnersText = `${prize.quota} ${pluralize('winner', prize.quota)}`;

  const isAllocating = state === 'allocating';
  const isAllocation = state === 'allocation';
  const isAllocated = state === 'allocated';

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
            <div className="text-left">
              <h4 className="font-medium text-sm sm:text-base">{prize.name}</h4>
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
