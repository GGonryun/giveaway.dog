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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ReferrerData } from '@/schemas/index';

interface ReferrersBarChartProps {
  data: ReferrerData[];
}

const chartConfig = {
  visits: {
    label: 'Visits',
    color: 'var(--color-chart-1)'
  },
  conversions: {
    label: 'Conversions',
    color: 'var(--color-chart-2)'
  }
};

export function ReferrersBarChart({ data }: ReferrersBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Referrers</CardTitle>
        <CardDescription>
          Traffic sources and conversion performance
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="overflow-hidden">
          <ChartContainer config={chartConfig} className="w-full">
            <BarChart
              data={data}
              margin={{ top: 10, right: 1, bottom: 50, left: -40 }}
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
                dataKey="visits"
                fill="var(--color-chart-1)"
                name="Visits"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="conversions"
                fill="var(--color-chart-2)"
                name="Conversions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="mt-3 sm:mt-4 space-y-2">
          <div className="hidden sm:grid grid-cols-4 gap-4 text-xs text-muted-foreground font-medium border-b pb-2">
            <div>Source</div>
            <div>Visits</div>
            <div>Conversions</div>
            <div>Rate</div>
          </div>
          {data.map((item) => (
            <div
              key={item.source}
              className="sm:grid sm:grid-cols-4 gap-4 text-sm border-b border-border/20 pb-2 last:border-b-0"
            >
              <div className="font-medium mb-1 sm:mb-0 truncate">
                {item.source}
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground sm:hidden text-xs">
                  Visits:
                </span>
                <span>{item.visits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground sm:hidden text-xs">
                  Conversions:
                </span>
                <span>{item.conversions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground sm:hidden text-xs">
                  Rate:
                </span>
                <span className="text-muted-foreground">
                  {item.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
