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
import { PieChart, Pie, Cell } from 'recharts';
import { BotDetectionData } from "@/schemas";

interface BotDetectionPieChartProps {
  data: BotDetectionData[];
  totalEntries: number;
}

const chartConfig = {
  legitimate: {
    label: 'Legitimate Entries',
    color: 'var(--color-chart-1)'
  },
  filtered: {
    label: 'Filtered/Bot Entries',
    color: 'var(--color-chart-2)'
  }
};

export function BotDetectionPieChart({
  data,
  totalEntries
}: BotDetectionPieChartProps) {
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot Detection</CardTitle>
        <CardDescription>
          Breakdown of legitimate vs filtered entries
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="overflow-hidden">
          <ChartContainer
            config={chartConfig}
            className="min-h-[200px] sm:min-h-[300px] w-full"
          >
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={60}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={ChartTooltipContent} />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="flex items-center justify-center space-x-3 sm:space-x-6 text-xs sm:text-sm text-muted-foreground mt-3 flex-wrap gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="whitespace-nowrap">
                {item.name}: {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
