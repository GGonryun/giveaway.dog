'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  TWITCH_BONUS_METRICS,
  TWITCH_METRIC_LABELS,
  TWITCH_METRIC_ICONS,
  TWITCH_METRIC_MAX,
  TWITCH_METRIC_DESCRIPTION,
  TwitchScoreMetrics,
  TwitchMetricKey
} from '@/lib/scoring/schemas';

import { useState } from 'react';

import { QualityBadge } from './quality-badge';
import { MetricIcon, MetricLayout } from './metric-layout';

export const TwitchQualityMetrics: React.FC<{
  metrics: TwitchScoreMetrics;
}> = ({ metrics }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  return (
    <>
      {TWITCH_BONUS_METRICS.length > 0 && (
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
            {TWITCH_BONUS_METRICS.map((key: TwitchMetricKey) => {
              return (
                <TwitchBonusMetric
                  key={key}
                  open={expandedMetric === key}
                  onOpenChange={(isOpen) =>
                    setExpandedMetric(isOpen ? key : null)
                  }
                  metric={{
                    key,
                    value: metrics[key]
                  }}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
};

const TwitchBonusMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: TwitchMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = TWITCH_METRIC_MAX[key];
  const label = TWITCH_METRIC_LABELS[key];
  const Icon = TWITCH_METRIC_ICONS[key];

  const type = 'excellent';
  const badge = 'Granted';

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={TWITCH_METRIC_DESCRIPTION[key]}
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
