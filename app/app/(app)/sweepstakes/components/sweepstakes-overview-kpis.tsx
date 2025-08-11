"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Play,
  Users,
  Target
} from "lucide-react";

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

interface SweepstakesOverviewKPIsProps {
  data: OverviewKPIData;
}

export function SweepstakesOverviewKPIs({ data }: SweepstakesOverviewKPIsProps) {
  const kpis = [
    {
      title: "Total Sweepstakes",
      value: data.totalSweepstakes.toString(),
      change: data.totalSweepstakesChange,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Active Campaigns",
      value: data.activeSweepstakes.toString(),
      change: data.activeSweepstakesChange,
      icon: Play,
      color: "text-green-600"
    },
    {
      title: "Total Entries",
      value: data.totalEntries.toLocaleString(),
      change: data.totalEntriesChange,
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Avg Conversion Rate",
      value: `${data.avgConversionRate.toFixed(1)}%`,
      change: data.avgConversionRateChange,
      icon: Target,
      color: "text-orange-600"
    }
  ];

  const getChangeIndicator = (change: number) => {
    const isPositive = change > 0;
    
    if (change === 0) return null;
    
    return (
      <div className="flex items-center space-x-1 text-xs">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <Badge
          variant={isPositive ? 'default' : 'destructive'}
          className="text-xs"
        >
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Badge>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const changeIndicator = getChangeIndicator(kpi.change);

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {changeIndicator && (
                <div className="mt-1">
                  {changeIndicator}
                </div>
              )}
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