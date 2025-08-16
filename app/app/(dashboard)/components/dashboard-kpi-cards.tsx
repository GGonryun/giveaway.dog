'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Gift,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { DashboardKPIData } from '@/schemas/index';

interface KPICardProps {
  data: DashboardKPIData;
}

export function DashboardKPICards({ data }: KPICardProps) {
  const kpis = [
    {
      title: 'Entries Today',
      value: data.entriesTotal.toLocaleString(),
      change: data.entriesChange,
      icon: Gift,
      color: 'text-blue-600'
    },
    {
      title: 'New Users (30d)',
      value: data.newUsers.toLocaleString(),
      change: data.newUsersChange,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Active Sweepstakes',
      value: data.activeSweepstakes.toString(),
      change: 0,
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: 'Bot Filter Rate',
      value: `${data.botFilterRate}%`,
      change: 0,
      icon: AlertTriangle,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change > 0;
        const hasChange = kpi.change !== 0;

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {hasChange && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <Badge
                    variant={isPositive ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {isPositive ? '+' : ''}
                    {kpi.change}%
                  </Badge>
                  <span>from last period</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
