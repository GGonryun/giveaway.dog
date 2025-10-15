'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import React from 'react';
import { RiskMetrics } from './risk-metrics';
import {
  toQualityType,
  QUALITY_THEME,
  QUALITY_LABELS,
  QUALITY_DESCRIPTION,
  QUALITY_ICON
} from '@/schemas/quality';
import { UserQualitySchema } from '@/schemas/user-scoring';
import { QualityMetrics } from './quality-metrics';
import { QualityBadge } from './quality-badge';

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
  const theme = QUALITY_THEME[quality];
  const label = QUALITY_LABELS[quality];
  const description = QUALITY_DESCRIPTION[quality];
  const Icon = QUALITY_ICON[quality];

  return (
    <div className={cn('p-4 border rounded-lg', theme.border, theme.light)}>
      <div
        className={cn(
          'flex items-center space-x-2 text-sm font-medium',
          theme.text
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={cn('text-sm mt-1', theme.text)}>{description}</div>
    </div>
  );
};
