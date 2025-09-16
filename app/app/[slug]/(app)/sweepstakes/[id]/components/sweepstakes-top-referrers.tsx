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
  ChartTooltipContent,
  CustomTooltipProps
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface TopReferrerData {
  source: string;
  visits: number;
  entries: number;
  conversionRate: number;
}

interface SweepstakesTopReferrersProps {
  data: TopReferrerData[];
}

const chartConfig = {
  entries: {
    label: 'Entries',
    color: 'var(--color-chart-1)'
  },
  visits: {
    label: 'Visits',
    color: 'var(--color-chart-2)'
  }
};

export const SweepstakesTopReferrers = ({
  data
}: SweepstakesTopReferrersProps) => {
  const totalEntries = data.reduce((sum, item) => sum + item.entries, 0);
  const bestConverter = data.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Top Referrers</span>
        </CardTitle>
        <CardDescription>
          Traffic sources and their conversion performance
        </CardDescription>

        {/* Key Metrics */}
        <div className="flex items-center space-x-4 pt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Best converter:</span>
            <Badge variant="default" className="ml-1">
              {bestConverter.source} ({bestConverter.conversionRate.toFixed(1)}
              %)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        {/* Chart */}
        <div className="overflow-hidden mb-4">
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="source"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <ChartTooltip content={ChartTooltipContent} />
              <Bar
                dataKey="entries"
                fill="var(--color-chart-1)"
                name="Entries"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Source Performance</h4>
          <div className="space-y-2">
            {data.map((item) => (
              <div
                key={item.source}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">{item.source}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.visits.toLocaleString()} visits
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {item.entries.toLocaleString()}
                  </div>
                  <div
                    className={`text-xs ${
                      item.conversionRate > 25
                        ? 'text-green-600'
                        : item.conversionRate > 20
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {item.conversionRate.toFixed(1)}% conv
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
          <div>
            <div className="text-muted-foreground">Total Entries</div>
            <div className="font-medium">{totalEntries.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Sources</div>
            <div className="font-medium">{data.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
