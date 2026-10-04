'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { AllocationStatisticsSchema } from '@giveaway/allocation-model/schemas';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@giveaway/ui-charts/chart';
import { Pie, PieChart, Cell, Legend } from 'recharts';

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)'
];

export const PrizeAllocationChart: React.FC<{
  allocations: AllocationStatisticsSchema;
}> = ({ allocations }) => {
  const chartData = allocations.allocationsByPrize.map((allocation, index) => ({
    name: allocation.prizeName,
    value: allocation.allocationCount,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const chartConfig = allocations.allocationsByPrize.reduce(
    (config, allocation, index) => {
      config[allocation.prizeId] = {
        label: allocation.prizeName,
        color: CHART_COLORS[index % CHART_COLORS.length]
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>
  );

  const totalAllocations = allocations.totalAllocations;
  const hasAllocations = totalAllocations > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prize Allocation Distribution</CardTitle>
        <CardDescription>
          Breakdown of user prize selections across all available prizes
        </CardDescription>

        <div className="flex items-center space-x-6 pt-2">
          <div className="text-sm text-muted-foreground">
            Total Selections:{' '}
            <span className="font-medium">
              {totalAllocations.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {hasAllocations ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[400px]"
          >
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const percentage =
                      totalAllocations > 0
                        ? (
                            ((data.value as number) / totalAllocations) *
                            100
                          ).toFixed(1)
                        : '0';

                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: data.payload.fill }}
                              />
                              <span className="font-medium">{data.name}</span>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                            {data.value}
                            <span className="text-sm font-normal text-muted-foreground">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => (
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    {payload?.map((entry, index) => (
                      <div
                        key={`legend-${index}`}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {entry.value}:{' '}
                          {(
                            (chartData[index].value / totalAllocations) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-center text-muted-foreground">
            <div>
              <p className="text-lg font-medium">No Allocations Yet</p>
              <p className="text-sm">
                Users haven't selected their prize preferences yet
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
