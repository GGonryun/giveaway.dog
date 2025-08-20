'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingDown,
  Users,
  MousePointer,
  Edit,
  Mail,
  CheckCircle,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface ConversionFunnelData {
  stage: string;
  value: number;
  percentage: number;
  dropRate: number;
}

interface SweepstakesConversionFunnelProps {
  data: ConversionFunnelData[];
}

export const SweepstakesConversionFunnel = ({
  data
}: SweepstakesConversionFunnelProps) => {
  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'page visits':
        return <Users className="h-4 w-4" />;
      case 'started entry':
        return <MousePointer className="h-4 w-4" />;
      case 'completed form':
        return <Edit className="h-4 w-4" />;
      case 'email verified':
        return <Mail className="h-4 w-4" />;
      case 'qualified lead':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getDropSeverity = (dropRate: number) => {
    if (dropRate > 50) return { color: 'text-red-500', severity: 'high' };
    if (dropRate > 30) return { color: 'text-yellow-500', severity: 'medium' };
    return { color: 'text-green-500', severity: 'low' };
  };

  const overallConversion =
    data.length > 0
      ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1)
      : '0';
  const biggestDrop = Math.max(...data.map((stage) => stage.dropRate));
  const biggestDropStage = data.find((stage) => stage.dropRate === biggestDrop);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingDown className="h-5 w-5" />
          <span>Conversion Funnel</span>
        </CardTitle>
        <CardDescription>
          Track user journey from visit to qualified lead
        </CardDescription>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6 pt-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Overall conversion:</span>
            <Badge variant="default" className="ml-1">
              {overallConversion}%
            </Badge>
          </div>
          {biggestDropStage && (
            <div className="text-sm">
              <span className="text-muted-foreground">Biggest drop:</span>
              <Badge variant="destructive" className="ml-1">
                {biggestDropStage.stage} ({biggestDrop.toFixed(1)}%)
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {data.map((stage, index) => {
            const isFirst = index === 0;
            const dropSeverity = getDropSeverity(stage.dropRate);

            return (
              <div key={stage.stage} className="relative">
                {/* Stage Card */}
                <div
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    stage.dropRate > 50
                      ? 'border-red-200 bg-red-50'
                      : stage.dropRate > 30
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStageIcon(stage.stage)}
                      <div>
                        <h4 className="font-medium text-sm">{stage.stage}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{stage.value.toLocaleString()} users</span>
                          <span>•</span>
                          <span>
                            {stage.percentage.toFixed(1)}% of previous
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isFirst && stage.dropRate > 0 && (
                        <div className="flex items-center space-x-1">
                          <TrendingDown
                            className={`h-3 w-3 ${dropSeverity.color}`}
                          />
                          <Badge
                            variant={
                              dropSeverity.severity === 'high'
                                ? 'destructive'
                                : dropSeverity.severity === 'medium'
                                  ? 'secondary'
                                  : 'default'
                            }
                            className="text-xs"
                          >
                            -{stage.dropRate.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={stage.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Conversion: {stage.percentage.toFixed(1)}%</span>
                      <span>{stage.value.toLocaleString()} users</span>
                    </div>
                  </div>
                </div>

                {/* Drop Indicator */}
                {!isFirst && stage.dropRate > 30 && (
                  <div className="absolute -top-2 right-4 z-10">
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        stage.dropRate > 50
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>High Drop</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Optimization Suggestions */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Optimization Opportunities</h4>
          <div className="grid gap-3 text-sm">
            {biggestDropStage && biggestDropStage.dropRate > 40 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800">
                    Address {biggestDropStage.stage} Drop
                  </div>
                  <div className="text-blue-600">
                    {biggestDropStage.dropRate.toFixed(1)}% of users drop off
                    here. Consider simplifying this step.
                  </div>
                </div>
              </div>
            )}

            {data.some(
              (stage) =>
                stage.stage.toLowerCase().includes('email') &&
                stage.dropRate > 20
            ) && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                <Mail className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">
                    Improve Email Verification
                  </div>
                  <div className="text-green-600">
                    Consider double opt-in confirmation or instant email
                    verification to reduce drop-off.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
          <div>
            <div className="text-muted-foreground">Total Visitors</div>
            <div className="font-medium">
              {data[0]?.value.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div className="font-medium text-green-600">
              {data[data.length - 1]?.value.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Conversion Rate</div>
            <div className="font-medium">{overallConversion}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg. Drop per Step</div>
            <div className="font-medium text-orange-600">
              {(
                data.reduce((sum, stage) => sum + stage.dropRate, 0) /
                data.length
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
