'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  DISCORD_QUALITY_METRICS,
  DISCORD_BONUS_METRICS,
  DISCORD_RISK_METRICS,
  DISCORD_METRIC_LABELS,
  DISCORD_METRIC_ICONS,
  DISCORD_METRIC_MAX,
  DISCORD_METRIC_DESCRIPTION,
  DiscordScoreMetrics,
  DiscordMetricKey
} from '@/lib/scoring/schemas';
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

export const DiscordQualityMetrics: React.FC<{
  metrics: DiscordScoreMetrics;
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
            Platform-specific quality indicators from Discord profile
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:gap-4 grid-cols-1 xl:grid-cols-2 items-start">
          {DISCORD_QUALITY_METRICS.map((key: DiscordMetricKey) => {
            return (
              <DiscordQualityMetric
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

      {DISCORD_BONUS_METRICS.length > 0 && (
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
            {DISCORD_BONUS_METRICS.map((key: DiscordMetricKey) => {
              return (
                <DiscordBonusMetric
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

      {DISCORD_RISK_METRICS.length > 0 && (
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
            {DISCORD_RISK_METRICS.map((key: DiscordMetricKey) => {
              return (
                <DiscordRiskMetric
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

const DiscordQualityMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: DiscordMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = DISCORD_METRIC_MAX[key];
  const label = DISCORD_METRIC_LABELS[key];
  const Icon = DISCORD_METRIC_ICONS[key];

  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const type = toQualityType(percentage);
  const badge = QUALITY_BADGE_TEXT[type];
  const theme = QUALITY_THEME[type];

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={DISCORD_METRIC_DESCRIPTION[key]}
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

const DiscordBonusMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: DiscordMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const max = DISCORD_METRIC_MAX[key];
  const label = DISCORD_METRIC_LABELS[key];
  const Icon = DISCORD_METRIC_ICONS[key];

  const type = 'excellent';
  const badge = 'Granted';

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={DISCORD_METRIC_DESCRIPTION[key]}
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

const DiscordRiskMetric: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: {
    key: DiscordMetricKey;
    value: number;
  };
}> = ({ open, onOpenChange, metric: { key, value } }) => {
  const label = DISCORD_METRIC_LABELS[key];
  const Icon = DISCORD_METRIC_ICONS[key];

  const hasRisk = value < 0;
  const type = hasRisk ? 'poor' : 'excellent';
  const badge = hasRisk ? 'Flagged' : 'Clear';

  return (
    <MetricLayout
      open={open}
      icon={<MetricIcon type={type} icon={Icon} />}
      onOpenChange={onOpenChange}
      description={DISCORD_METRIC_DESCRIPTION[key]}
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
