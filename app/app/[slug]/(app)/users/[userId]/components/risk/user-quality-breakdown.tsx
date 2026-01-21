'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import React from 'react';
import { RiskMetrics } from './risk-metrics';
import { BonusMetrics } from './bonus-metrics';
import {
  toQualityType,
  QUALITY_THEME,
  QUALITY_LABELS,
  QUALITY_DESCRIPTION,
  QUALITY_ICON,
  QUALITY_ALERT_VARIANT
} from '@/schemas/quality';
import { UserQualitySchema, UserScoreMetricsSchema } from '@/schemas/user-scoring';
import { QualityMetrics } from './quality-metrics';
import { QualityBadge } from './quality-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TwitterQualityMetrics } from './twitter-quality-metrics';
import { BlueskyQualityMetrics } from './bluesky-quality-metrics';
import { DiscordQualityMetrics } from './discord-quality-metrics';
import {
  TwitterScoreMetrics,
  BlueskyScoreMetrics,
  DiscordScoreMetrics
} from '@/lib/scoring/schemas';

export const UserQualityBreakdown: React.FC<{
  quality: UserQualitySchema;
}> = ({ quality }) => {
  const type = toQualityType(quality.score);
  const theme = QUALITY_THEME[type];
  const label = QUALITY_LABELS[type];

  // Determine which metrics component to render based on quality type
  const renderMetrics = () => {
    switch (quality.type) {
      case 'SIGNUP':
      case 'ANONYMOUS':
      case 'MANUAL_IMPORT':
        return (
          <>
            <QualityMetrics metrics={quality.metrics as UserScoreMetricsSchema} />
            <BonusMetrics metrics={quality.metrics as UserScoreMetricsSchema} />
            <RiskMetrics metrics={quality.metrics as UserScoreMetricsSchema} />
          </>
        );

      case 'DISCORD_IMPORT':
        return (
          <DiscordQualityMetrics
            metrics={quality.metrics as DiscordScoreMetrics}
          />
        );

      case 'TWITTER_IMPORT':
        return (
          <TwitterQualityMetrics
            metrics={quality.metrics as TwitterScoreMetrics}
          />
        );

      case 'BLUESKY_IMPORT':
        return (
          <BlueskyQualityMetrics
            metrics={quality.metrics as BlueskyScoreMetrics}
          />
        );

      default:
        return <div>Unknown quality type</div>;
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Quality Score</div>
              <QualityBadge type={type}>{label}</QualityBadge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Risk Score</span>
                <span>{quality.score}/100</span>
              </div>
              <Progress
                value={quality.score}
                indicatorClassName={theme.base}
                className="h-3"
              />
            </div>

            <QualityScoreAlert score={quality.score} />
          </CardContent>
        </Card>

        {renderMetrics()}
      </div>
    </div>
  );
};

const QualityScoreAlert: React.FC<{ score: number }> = ({ score }) => {
  const quality = toQualityType(score);
  const label = QUALITY_LABELS[quality];
  const description = QUALITY_DESCRIPTION[quality];
  const variant = QUALITY_ALERT_VARIANT[quality];
  const Icon = QUALITY_ICON[quality];

  return (
    <Alert variant={variant}>
      <Icon />
      <AlertTitle className="font-semibold">{label}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};
