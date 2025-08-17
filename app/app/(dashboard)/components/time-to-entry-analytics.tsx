'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Clock, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { TimeToEntryDistribution, TimeToEntryTimeline } from '@/schemas/index';

interface TimeToEntryAnalyticsProps {
  distributionData: TimeToEntryDistribution[];
  timelineData: TimeToEntryTimeline[];
  averageTime: number;
  medianTime: number;
  conversionByTime: number[];
}

const chartConfig = {
  userCount: {
    label: 'Users',
    color: 'var(--color-chart-1)'
  },
  entries: {
    label: 'Entries',
    color: 'var(--color-chart-2)'
  },
  avgTime: {
    label: 'Avg Time',
    color: 'var(--color-chart-3)'
  }
};

export function TimeToEntryAnalytics({
  distributionData,
  timelineData,
  averageTime,
  medianTime,
  conversionByTime
}: TimeToEntryAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<
    'distribution' | 'timeline' | 'detailed'
  >('distribution');

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getFrictionLevel = (avgTime: number) => {
    if (avgTime <= 30)
      return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' };
    if (avgTime <= 120)
      return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const friction = getFrictionLevel(averageTime);
  const quickEntries = distributionData
    .filter(
      (d) => d.timeRange.includes('0-30s') || d.timeRange.includes('30s-2m')
    )
    .reduce((sum, d) => sum + d.percentage, 0);
  const slowEntries = distributionData
    .filter((d) => d.timeRange.includes('5m+') || d.timeRange.includes('10m+'))
    .reduce((sum, d) => sum + d.percentage, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Time-to-Entry Analytics</span>
        </CardTitle>
        <CardDescription>
          Measure form friction and user engagement patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-3 sm:p-4 rounded-lg ${friction.bg}`}>
              <div className="flex items-center space-x-2">
                <Clock className={`h-4 w-4 ${friction.color}`} />
                <div className="text-sm font-medium">Avg Time</div>
              </div>
              <div className={`text-2xl font-bold ${friction.color}`}>
                {formatTime(averageTime)}
              </div>
              <Badge
                variant={
                  friction.level === 'Low'
                    ? 'default'
                    : friction.level === 'Medium'
                      ? 'secondary'
                      : 'destructive'
                }
                className="text-xs mt-1"
              >
                {friction.level} Friction
              </Badge>
            </div>

            <div className="p-3 sm:p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Median Time</div>
              <div className="text-2xl font-bold">{formatTime(medianTime)}</div>
              <div className="text-xs text-muted-foreground">
                50th percentile
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700">
                Quick Entries
              </div>
              <div className="text-2xl font-bold text-green-600">
                {quickEntries.toFixed(1)}%
              </div>
              <div className="text-xs text-green-600">Under 2 minutes</div>
            </div>

            <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-700">
                Slow Entries
              </div>
              <div className="text-2xl font-bold text-red-600">
                {slowEntries.toFixed(1)}%
              </div>
              <div className="text-xs text-red-600">Over 5 minutes</div>
            </div>
          </div>

          {/* Form Friction Alert */}
          {averageTime > 180 && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">
                  High Form Friction Detected
                </div>
                <div className="text-sm text-yellow-600">
                  Average time-to-entry is {formatTime(averageTime)}. Consider
                  simplifying your entry form to improve conversion rates.
                </div>
              </div>
            </div>
          )}

          {/* View Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Analytics View</h3>
              <Select
                value={selectedView}
                onValueChange={(
                  value: 'distribution' | 'timeline' | 'detailed'
                ) => setSelectedView(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribution">
                    Time Distribution
                  </SelectItem>
                  <SelectItem value="timeline">Trend Timeline</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Chart/Content Display */}
            {selectedView === 'distribution' && (
              <div className="overflow-hidden">
                <ChartContainer
                  config={chartConfig}
                  className="min-h-[180px] sm:min-h-[250px] md:min-h-[300px] w-full min-w-0"
                >
                  <BarChart
                    data={distributionData}
                    margin={{ top: 5, right: 15, bottom: 25, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timeRange"
                      tick={{ fontSize: 8 }}
                      angle={-45}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 8 }}
                      width={25}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={ChartTooltipContent} />
                    <Bar
                      dataKey="percentage"
                      fill="var(--color-chart-1)"
                      name="percentage"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}

            {selectedView === 'timeline' && (
              <div className="overflow-hidden">
                <ChartContainer
                  config={chartConfig}
                  className="min-h-[180px] sm:min-h-[250px] md:min-h-[300px] w-full min-w-0"
                >
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 5, right: 15, bottom: 10, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 8 }} />
                    <YAxis
                      tick={{ fontSize: 8 }}
                      width={25}
                      tickFormatter={(value) => formatTime(value)}
                    />
                    <ChartTooltip content={ChartTooltipContent} />
                    <Area
                      type="monotone"
                      dataKey="avgTime"
                      stroke="var(--color-chart-3)"
                      fill="var(--color-chart-3)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}

            {selectedView === 'detailed' && (
              <div className="space-y-2">
                {distributionData.map((item, index) => (
                  <div
                    key={item.timeRange}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{item.timeRange}</div>
                      {item.timeRange.includes('5m+') && (
                        <Badge variant="destructive" className="text-xs">
                          High Friction
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="font-medium">
                          {item.userCount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          users
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">
                          {item.avgConversionRate.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground ml-1">
                          convert
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optimization Recommendations */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="font-medium">Optimization Recommendations</h3>
            <div className="grid gap-3 text-sm">
              {averageTime > 120 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800">
                      Reduce Form Fields
                    </div>
                    <div className="text-blue-600">
                      Consider removing non-essential fields to decrease average
                      entry time
                    </div>
                  </div>
                </div>
              )}
              {quickEntries < 50 && (
                <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800">
                      Improve UX Flow
                    </div>
                    <div className="text-green-600">
                      Only {quickEntries.toFixed(1)}% of users enter quickly.
                      Optimize form layout and copy
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-purple-800">
                    Target: Under 60 seconds
                  </div>
                  <div className="text-purple-600">
                    Best-performing giveaways typically have sub-60 second entry
                    times
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Fastest Entry</div>
              <div className="font-medium text-green-600">8s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Slowest Entry</div>
              <div className="font-medium text-red-600">25m</div>
            </div>
            <div>
              <div className="text-muted-foreground">95th Percentile</div>
              <div className="font-medium">{formatTime(averageTime * 2.5)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Form Abandonment</div>
              <div className="font-medium text-yellow-600">
                {(
                  100 -
                  distributionData.reduce((sum, d) => sum + d.percentage, 0)
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
