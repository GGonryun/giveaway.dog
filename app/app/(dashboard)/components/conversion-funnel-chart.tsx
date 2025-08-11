'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
}

interface ConversionFunnelChartProps {
  data: FunnelStage[];
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>User journey from visit to conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100;
            const isLastStage = index === data.length - 1;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span>{stage.value.toLocaleString()}</span>
                    <span>({stage.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-12 flex items-center justify-center">
                    <div
                      className={`rounded-full h-10 flex items-center justify-center text-white text-sm font-medium transition-all duration-500 ${
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
                      style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                    >
                      {stage.value.toLocaleString()}
                    </div>
                  </div>
                  {!isLastStage && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {!isLastStage && (
                  <div className="text-center text-xs text-muted-foreground pt-2">
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
