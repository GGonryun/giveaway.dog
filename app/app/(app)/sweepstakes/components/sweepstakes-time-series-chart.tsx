"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useState } from "react";

interface TimeSeriesData {
  date: string;
  entries: number;
  instagram: number;
  twitter: number;
  direct: number;
  facebook: number;
}

interface SweepstakesTimeSeriesChartProps {
  data: TimeSeriesData[];
}

const chartConfig = {
  entries: {
    label: "Total Entries",
    color: "var(--color-chart-1)"
  },
  instagram: {
    label: "Instagram",
    color: "var(--color-chart-2)"
  },
  twitter: {
    label: "Twitter/X",
    color: "var(--color-chart-3)"
  },
  direct: {
    label: "Direct",
    color: "var(--color-chart-4)"
  },
  facebook: {
    label: "Facebook",
    color: "var(--color-chart-5)"
  }
};

export function SweepstakesTimeSeriesChart({ data }: SweepstakesTimeSeriesChartProps) {
  const [isStacked, setIsStacked] = useState(true);
  const [compareMode, setCompareMode] = useState(false);

  // Calculate trend
  const totalEntries = data.reduce((sum, day) => sum + day.entries, 0);
  const avgEntries = totalEntries / data.length;
  const lastEntry = data[data.length - 1]?.entries || 0;
  const trend = lastEntry > avgEntries ? 'up' : 'down';
  const trendPercentage = Math.abs(((lastEntry - avgEntries) / avgEntries) * 100).toFixed(1);

  // Get top performing source
  const sourceTotals = {
    instagram: data.reduce((sum, day) => sum + day.instagram, 0),
    twitter: data.reduce((sum, day) => sum + day.twitter, 0),
    direct: data.reduce((sum, day) => sum + day.direct, 0),
    facebook: data.reduce((sum, day) => sum + day.facebook, 0)
  };
  const topSource = Object.entries(sourceTotals).reduce((a, b) => sourceTotals[a[0]] > sourceTotals[b[0]] ? a : b)[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Daily Entries Timeline</span>
            </CardTitle>
            <CardDescription>
              Entry volume by source over time
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Stacked Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Stacked</span>
              <Switch checked={isStacked} onCheckedChange={setIsStacked} />
            </div>
            
            {/* Compare Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Compare</span>
              <Switch checked={compareMode} onCheckedChange={setCompareMode} />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6 pt-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
              {trend === 'up' ? '+' : '-'}{trendPercentage}%
            </Badge>
            <span className="text-sm text-muted-foreground">vs avg</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Top source: <span className="font-medium capitalize">{topSource}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{totalEntries.toLocaleString()}</span> entries
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <div className="overflow-hidden">
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              
              {isStacked ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="instagram"
                    stackId="1"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="twitter"
                    stackId="1"
                    stroke="var(--color-chart-3)"
                    fill="var(--color-chart-3)"
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="direct"
                    stackId="1"
                    stroke="var(--color-chart-4)"
                    fill="var(--color-chart-4)"
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="facebook"
                    stackId="1"
                    stroke="var(--color-chart-5)"
                    fill="var(--color-chart-5)"
                    fillOpacity={0.8}
                  />
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="entries"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </>
              )}
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Source Performance Summary */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Source Performance (7 days)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {Object.entries(sourceTotals).map(([source, total]) => (
              <div key={source} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{source}</span>
                  <span className="font-medium">{total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(total / totalEntries) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {((total / totalEntries) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}