'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Play } from 'lucide-react';

interface OverviewKPIData {
  totalSweepstakes: number;
  totalSweepstakesChange: number;
  activeSweepstakes: number;
  activeSweepstakesChange: number;
  totalEntries: number;
  totalEntriesChange: number;
  avgConversionRate: number;
  avgConversionRateChange: number;
}

interface SweepstakesMobileKPIsProps {
  data: OverviewKPIData;
}

export function SweepstakesMobileKPIs({ data }: SweepstakesMobileKPIsProps) {
  const getChangeIndicator = (change: number) => {
    const isPositive = change > 0;

    if (change === 0) return null;

    return (
      <div className="flex items-center space-x-1">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <Badge
          variant={isPositive ? 'default' : 'destructive'}
          className="text-xs px-1 py-0"
        >
          {isPositive ? '+' : ''}
          {change.toFixed(1)}%
        </Badge>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Primary Stats - Full Width Cards */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total
                </span>
              </div>
              <div className="text-2xl font-bold">{data.totalSweepstakes}</div>
              <div className="flex items-center justify-center mt-1">
                {getChangeIndicator(data.totalSweepstakesChange)}
              </div>
            </div>

            <div className="text-center border-l">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Play className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Active
                </span>
              </div>
              <div className="text-2xl font-bold">{data.activeSweepstakes}</div>
              <div className="flex items-center justify-center mt-1">
                {getChangeIndicator(data.activeSweepstakesChange)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats - Compact Cards */}
      <Card>
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Total Entries
            </div>
            <div className="text-lg font-bold">
              {data.totalEntries.toLocaleString()}
            </div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIndicator(data.totalEntriesChange)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Avg Conv Rate
            </div>
            <div className="text-lg font-bold">
              {data.avgConversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIndicator(data.avgConversionRateChange)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
