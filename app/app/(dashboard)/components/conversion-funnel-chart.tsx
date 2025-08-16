'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FunnelStageData } from '@/schemas/index';

interface ConversionFunnelChartProps {
  data: FunnelStageData[];
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>User journey from visit to conversion</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {data.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100;
            const isLastStage = index === data.length - 1;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-sm">
                  <span className="font-medium truncate">{stage.stage}</span>
                  <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground text-xs sm:text-sm">
                    <span>{stage.value.toLocaleString()}</span>
                    <span>({stage.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-8 sm:h-12 flex items-center justify-center overflow-hidden">
                    <div
                      className={`rounded-full h-6 sm:h-10 flex items-center justify-center text-white text-xs sm:text-sm font-medium transition-all duration-500 min-w-0 ${
                        index === 0
                          ? 'bg-blue-500'
                          : index === 1
                            ? 'bg-green-500'
                            : index === 2
                              ? 'bg-orange-500'
                              : index === 3
                                ? 'bg-purple-500'
                                : 'bg-red-500'
                      }`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <span className="px-1 truncate">
                        {stage.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {!isLastStage && (
                    <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 sm:border-l-4 sm:border-r-4 sm:border-t-8 border-transparent border-t-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {!isLastStage && (
                  <div className="text-center text-xs text-muted-foreground pt-1 sm:pt-2">
                    {index < data.length - 1 &&
                      `${((data[index + 1].value / stage.value) * 100).toFixed(1)}% continue`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
