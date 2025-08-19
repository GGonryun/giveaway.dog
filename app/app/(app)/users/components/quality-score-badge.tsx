'use client';

import { CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

interface QualityScoreBadgeProps {
  score: number;
  breakdown?: any;
  showTooltip?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const QualityScoreBadge = ({
  score,
  breakdown = {},
  showTooltip = true,
  size = 'default'
}: QualityScoreBadgeProps) => {
  const getScoreInfo = (score: number) => {
    if (score >= 80)
      return {
        label: 'High',
        color: 'text-green-600',
        icon: CheckCircle,
        bgColor: 'bg-green-600'
      };
    if (score >= 60)
      return {
        label: 'Medium',
        color: 'text-yellow-600',
        icon: AlertCircle,
        bgColor: 'bg-yellow-600'
      };
    if (score >= 40)
      return {
        label: 'Low',
        color: 'text-orange-600',
        icon: AlertTriangle,
        bgColor: 'bg-orange-600'
      };
    return {
      label: 'Very Low',
      color: 'text-red-600',
      icon: XCircle,
      bgColor: 'bg-red-600'
    };
  };

  const scoreInfo = getScoreInfo(score);
  const IconComponent = scoreInfo.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Quality Score</span>
        <div className="flex items-center space-x-1">
          <IconComponent className={`h-3 w-3 ${scoreInfo.color}`} />
          <span className={`font-medium ${scoreInfo.color}`}>
            {score}/100 • {scoreInfo.label}
          </span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${scoreInfo.bgColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
