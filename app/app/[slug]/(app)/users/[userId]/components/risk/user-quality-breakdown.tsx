'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import React from 'react';
import { RiskMetrics } from './risk-metrics';
import {
  toQualityType,
  QUALITY_THEME,
  QUALITY_LABELS,
  QUALITY_DESCRIPTION,
  QUALITY_ICON,
  QUALITY_ALERT_VARIANT
} from '@/schemas/quality';
import { UserQualitySchema } from '@/schemas/user-scoring';
import { QualityMetrics } from './quality-metrics';
import { QualityBadge } from './quality-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const UserQualityBreakdown: React.FC<{ quality: UserQualitySchema }> = ({
  quality
}) => {
  const type = toQualityType(quality.score);
  const theme = QUALITY_THEME[type];
  const label = QUALITY_LABELS[type];

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

        <QualityMetrics metrics={quality.metrics} />
        <RiskMetrics metrics={quality.metrics} />
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
