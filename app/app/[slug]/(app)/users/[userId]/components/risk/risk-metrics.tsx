'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  USER_RISK_METRICS,
  USER_METRIC_LABELS,
  USER_METRIC_ICONS,
  USER_METRIC_DESCRIPTION,
  UserScoreMetricsSchema,
  UserScoreMetricKey,
  USER_METRIC_MAX
} from '@/schemas/user-scoring';
import { useState } from 'react';
import { QUALITY_BADGE_RISK, toQualityType } from '@/schemas/quality';
import { QualityBadge } from './quality-badge';
import { MetricIcon, MetricLayout } from './metric-layout';

interface RiskMetricsProps {
  metrics: UserScoreMetricsSchema;
}

export function RiskMetrics({ metrics }: RiskMetricsProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Risk Indicators
        </CardTitle>
        <CardDescription>
          Individual factors affecting user quality
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2">
        {USER_RISK_METRICS.map((key) => (
          <RiskMetric
            key={key}
            metric={{
              key: key,
              value: metrics[key]
            }}
            open={expandedMetric === key}
            onOpenChange={(isOpen) => setExpandedMetric(isOpen ? key : null)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

const RiskMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: UserScoreMetricKey;
    value: number;
  };
}> = ({ metric: { key, value }, open, onOpenChange }) => {
  const Icon = USER_METRIC_ICONS[key];
  const max = USER_METRIC_MAX[key];

  const positiveMax = Math.abs(max);
  const positiveValue = Math.abs(value);
  const percentage = Math.min(
    ((positiveMax - positiveValue) / positiveMax) * 100,
    100
  );

  const type = toQualityType(percentage);

  return (
    <MetricLayout
      open={open}
      onOpenChange={onOpenChange}
      icon={<MetricIcon type={type} icon={Icon} />}
      description={USER_METRIC_DESCRIPTION[key]}
      badge={
        <QualityBadge type={type} className="w-16">
          {QUALITY_BADGE_RISK[type]}
        </QualityBadge>
      }
      content={
        <div className="text-left flex-1">
          <div className="text-sm font-medium">{USER_METRIC_LABELS[key]}</div>
          <div className="text-sm text-muted-foreground">
            Impact: {value} points
          </div>
        </div>
      }
    />
  );
};
