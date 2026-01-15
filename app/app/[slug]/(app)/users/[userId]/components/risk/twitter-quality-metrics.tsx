'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  TWITTER_METRIC_LABELS,
  TWITTER_METRIC_ICONS,
  TWITTER_METRIC_MAX,
  TWITTER_METRIC_DESCRIPTION,
  TwitterScoreMetrics,
  TwitterMetricKey,
  TWITTER_QUALITY_METRICS,
  TWITTER_RISK_METRICS,
  TWITTER_BONUS_METRICS
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

export const TwitterQualityMetrics: React.FC<{
  metrics: TwitterScoreMetrics;
}> = ({ metrics }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Quality Indicators
          </CardTitle>
          <CardDescription>
            Platform-specific quality indicators from X (Twitter) profile
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
          {TWITTER_QUALITY_METRICS.map((key: TwitterMetricKey) => {
            return (
              <TwitterQualityMetric
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

      {TWITTER_BONUS_METRICS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Quality Bonus
            </CardTitle>
            <CardDescription>
              Additional bonus points for verified status and special
              achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
            {TWITTER_BONUS_METRICS.map((key: TwitterMetricKey) => {
              return (
                <TwitterBonusMetric
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

      {TWITTER_RISK_METRICS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Risk Indicators
            </CardTitle>
            <CardDescription>
              Factors that may indicate fraudulent or suspicious activity
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
            {TWITTER_RISK_METRICS.map((key: TwitterMetricKey) => {
              return (
                <TwitterRiskMetric
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

// Quality Metric Component (for regular quality indicators)
const TwitterQualityMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: TwitterMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = TWITTER_METRIC_MAX[key];
  const label = TWITTER_METRIC_LABELS[key];
  const Icon = TWITTER_METRIC_ICONS[key];

  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const type = toQualityType(percentage);
  const badge = QUALITY_BADGE_TEXT[type];
  const theme = QUALITY_THEME[type];

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={TWITTER_METRIC_DESCRIPTION[key]}
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

// Bonus Metric Component (for verified status - always shows as bonus, not poor)
const TwitterBonusMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: TwitterMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = TWITTER_METRIC_MAX[key];
  const label = TWITTER_METRIC_LABELS[key];
  const Icon = TWITTER_METRIC_ICONS[key];

  // For bonus metrics, we want to show them as excellent when achieved, not as poor when not
  const hasBonus = value > 0;
  const type = hasBonus ? 'excellent' : 'fair';
  const badge = hasBonus ? 'Achieved' : 'Not Set';

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={TWITTER_METRIC_DESCRIPTION[key]}
      badge={
        <QualityBadge type={type} className="w-16">
          {badge}
        </QualityBadge>
      }
      content={
        <div className="flex flex-col flex-1 text-left gap-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">
            Bonus: +{value} points {hasBonus && `(max: +${max})`}
          </div>
        </div>
      }
    />
  );
};

// Risk Metric Component (for banned account status)
const TwitterRiskMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: TwitterMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const label = TWITTER_METRIC_LABELS[key];
  const Icon = TWITTER_METRIC_ICONS[key];

  // For risk metrics, negative values are bad
  const hasRisk = value < 0;
  const type = hasRisk ? 'poor' : 'excellent';
  const badge = hasRisk ? 'Flagged' : 'Clear';

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={TWITTER_METRIC_DESCRIPTION[key]}
      badge={
        <QualityBadge type={type} className="w-16">
          {badge}
        </QualityBadge>
      }
      content={
        <div className="text-left flex-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">
            {hasRisk ? `Impact: ${value} points` : 'No issues detected'}
          </div>
        </div>
      }
    />
  );
};
