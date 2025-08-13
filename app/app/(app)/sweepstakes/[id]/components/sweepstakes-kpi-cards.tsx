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
  Target,
  Mail,
  Clock,
  Shield,
  Info
} from 'lucide-react';

interface KPIData {
  entriesToday: number;
  entriesTodayChange: number;
  uniqueEntrants: number;
  uniqueEntrantsChange: number;
  conversionRate: number;
  conversionRateChange: number;
  newLeads30d: number;
  newLeads30dChange: number;
  avgTimeToEntry: number; // in seconds
  avgTimeToEntryChange: number;
  botRate: number;
  botRateChange: number;
}

interface SweepstakesKPICardsProps {
  data: KPIData;
}

export const SweepstakesKPICards = ({ data }: SweepstakesKPICardsProps) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

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
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate.toFixed(1)}%`,
      change: data.conversionRateChange,
      icon: Target,
      color: 'text-purple-600',
      tooltip: 'Percentage of visitors who complete the entry process'
    },
    {
      title: 'New Leads (30d)',
      value: data.newLeads30d.toLocaleString(),
      change: data.newLeads30dChange,
      icon: Mail,
      color: 'text-indigo-600',
      tooltip:
        'Email addresses collected in the last 30 days with verified status'
    },
    {
      title: 'Avg Time-to-Entry',
      value: formatTime(data.avgTimeToEntry),
      change: data.avgTimeToEntryChange,
      icon: Clock,
      color: 'text-orange-600',
      tooltip:
        'Average time from landing page visit to completed entry submission',
      invertColors: true // Lower is better for time metrics
    },
    {
      title: 'Bot Rate',
      value: `${data.botRate.toFixed(1)}%`,
      change: data.botRateChange,
      icon: Shield,
      color: 'text-red-600',
      tooltip:
        'Percentage of entries flagged as potentially fraudulent or automated',
      invertColors: true // Lower is better for bot rate
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const changeIndicator = getChangeIndicator(
          kpi.change,
          kpi.invertColors
        );

        return (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-sm font-medium flex items-center cursor-help">
                      {kpi.title}
                      <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {changeIndicator && <div className="mt-1">{changeIndicator}</div>}
              {!changeIndicator && (
                <div className="text-xs text-muted-foreground mt-1">
                  from last period
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
