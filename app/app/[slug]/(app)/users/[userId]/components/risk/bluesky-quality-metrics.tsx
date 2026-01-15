'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  BLUESKY_QUALITY_METRICS,
  BLUESKY_METRIC_LABELS,
  BLUESKY_METRIC_ICONS,
  BLUESKY_METRIC_MAX,
  BLUESKY_METRIC_DESCRIPTION,
  BlueskyScoreMetrics,
  BlueskyMetricKey
} from '@/schemas/platform-scoring';
import {
  QUALITY_BADGE_TEXT,
  QUALITY_THEME,
  toQualityType
} from '@/schemas/quality';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';

import { QualityBadge } from './quality-badge';
import { MetricIcon, MetricLayout } from './metric-layout';

export const BlueskyQualityMetrics: React.FC<{
  metrics: BlueskyScoreMetrics;
}> = ({ metrics }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Quality Indicators
        </CardTitle>
        <CardDescription>
          Platform-specific quality indicators from Bluesky profile
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
        {BLUESKY_QUALITY_METRICS.map((key: BlueskyMetricKey) => {
          return (
            <BlueskyMetric
              key={key}
              open={expandedMetric === key}
              onOpenChange={(isOpen) => setExpandedMetric(isOpen ? key : null)}
              metric={{
                key,
                value: metrics[key]
              }}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

const BlueskyMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: BlueskyMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = BLUESKY_METRIC_MAX[key];
  const label = BLUESKY_METRIC_LABELS[key];
  const Icon = BLUESKY_METRIC_ICONS[key];
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const type = toQualityType(percentage);
  const badge = QUALITY_BADGE_TEXT[type];
  const theme = QUALITY_THEME[type];

  return (
    <MetricLayout
      key={key}
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={BLUESKY_METRIC_DESCRIPTION[key]}
      badge={
        <div className="flex flex-col items-center gap-1 w-16">
          <div className="text-sm font-medium">
            {value}/{max}
          </div>
          <QualityBadge type={type} className="w-full">
            {badge}
          </QualityBadge>
        </div>
      }
      content={
        <div className="flex flex-col flex-1 text-left gap-1">
          <div className="text-sm font-medium">{label}</div>
          <Progress
            value={percentage}
            className="h-4 flex-1"
            indicatorClassName={cn('h-4', theme.base)}
          />
        </div>
      }
    />
  );
};
