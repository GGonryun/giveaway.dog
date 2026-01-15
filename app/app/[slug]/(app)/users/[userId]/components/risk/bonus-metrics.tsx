'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  USER_BONUS_METRICS,
  USER_METRIC_LABELS,
  USER_METRIC_ICONS,
  USER_METRIC_DESCRIPTION,
  UserScoreMetricsSchema,
  UserScoreMetricKey,
  USER_METRIC_MAX
} from '@/schemas/user-scoring';
import { useState } from 'react';
import { QualityBadge } from './quality-badge';
import { MetricIcon, MetricLayout } from './metric-layout';

interface BonusMetricsProps {
  metrics: UserScoreMetricsSchema;
}

export function BonusMetrics({ metrics }: BonusMetricsProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  if (USER_BONUS_METRICS.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Quality Bonus
        </CardTitle>
        <CardDescription>
          Foundational points assigned to all users
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
        {USER_BONUS_METRICS.map((key) => (
          <BonusMetric
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

const BonusMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: UserScoreMetricKey;
    value: number;
  };
}> = ({ metric: { key, value }, open, onOpenChange }) => {
  const Icon = USER_METRIC_ICONS[key];
  const label = USER_METRIC_LABELS[key];
  const max = USER_METRIC_MAX[key];

  // For bonus metrics, always show as excellent since they're foundational
  const type = 'excellent';
  const badge = 'Granted';

  return (
    <MetricLayout
      open={open}
      onOpenChange={onOpenChange}
      icon={<MetricIcon type={type} icon={Icon} />}
      description={USER_METRIC_DESCRIPTION[key]}
      badge={
        <QualityBadge type={type} className="w-16">
          {badge}
        </QualityBadge>
      }
      content={
        <div className="text-left flex-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">
            Bonus: +{value} points (max: +{max})
          </div>
        </div>
      }
    />
  );
};
