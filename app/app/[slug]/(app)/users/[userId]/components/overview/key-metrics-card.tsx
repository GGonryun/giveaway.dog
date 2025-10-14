'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, BarChart3 } from 'lucide-react';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { cn } from '@/lib/utils';

export const KeyMetricsCard: React.FC<{
  participant: SweepstakesParticipantSchema;
}> = ({ participant }) => {
  return (
    <div className="grid gap-4 grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{participant.entries.length}</div>
          <p className="text-xs text-muted-foreground">
            {participant.engagement}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {participant.qualityScore} {toQualityIcon(participant.qualityScore)}
          </div>
          <p
            className={cn(
              'text-xs text-muted-foreground',
              toQualityColor(participant.qualityScore)
            )}
          >
            {toQualityLabel(participant.qualityScore)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const toQualityIcon = (score: number) => {
  if (score >= 80) return '✅';
  if (score >= 60) return '🆗';
  if (score >= 40) return '⚠️';
  if (score >= 20) return '🚨';
  return '🛑';
};

const toQualityColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-red-600';
  return 'text-red-600';
};

const toQualityLabel = (score: number) => {
  if (score >= 80) return 'Excellent quality';
  if (score >= 60) return 'Good quality';
  if (score >= 40) return 'Average quality';
  if (score >= 20) return 'Poor quality';
  return 'Bot-like behavior';
};
