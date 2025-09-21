'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Gift,
  Users,
  Info
} from 'lucide-react';

interface KPIData {
  entriesToday: number;
  entriesTodayChange: number;
  uniqueEntrants: number;
  uniqueEntrantsChange: number;
}

interface SweepstakesKPICardsProps {
  data: KPIData;
}

export const SweepstakesKPICards = ({ data }: SweepstakesKPICardsProps) => {

  const kpis = [
    {
      title: 'Entries Today',
      value: data.entriesToday.toLocaleString(),
      change: data.entriesTodayChange,
      icon: Gift,
      color: 'text-blue-600',
      tooltip:
        'Total number of entries submitted today across all active sweepstakes'
    },
    {
      title: 'Unique Entrants',
      value: data.uniqueEntrants.toLocaleString(),
      change: data.uniqueEntrantsChange,
      icon: Users,
      color: 'text-green-600',
      tooltip:
        'Number of unique users who have entered at least one sweepstakes'
    }
  ];

  const getChangeIndicator = (change: number, invertColors = false) => {
    const isPositive = change > 0;
    const isGoodChange = invertColors ? !isPositive : isPositive;

    if (change === 0) return null;

    return (
      <div className="flex items-center space-x-1 text-xs">
        {isPositive ? (
          <TrendingUp
            className={`h-3 w-3 ${isGoodChange ? 'text-green-500' : 'text-red-500'}`}
          />
        ) : (
          <TrendingDown
            className={`h-3 w-3 ${isGoodChange ? 'text-green-500' : 'text-red-500'}`}
          />
        )}
        <Badge
          variant={isGoodChange ? 'default' : 'destructive'}
          className="text-xs"
        >
          {isPositive ? '+' : ''}
          {change.toFixed(1)}%
        </Badge>
      </div>
    );
  };

  return (
    <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const changeIndicator = getChangeIndicator(
          kpi.change,
          kpi.invertColors
        );

        return (
          <Card key={kpi.title} className="hover:shadow-sm transition-shadow">
            <CardContent className="px-3 py-2">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs font-medium text-muted-foreground flex items-center cursor-help">
                        {kpi.title}
                        <Info className="h-3 w-3 ml-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="text-lg font-bold">{kpi.value}</div>
              {changeIndicator && <div>{changeIndicator}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
