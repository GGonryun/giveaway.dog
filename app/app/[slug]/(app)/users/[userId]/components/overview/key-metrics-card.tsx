'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SquareArrowOutUpRight } from 'lucide-react';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { cn } from '@/lib/utils';
import {
  QUALITY_ICON,
  QUALITY_LABELS,
  QUALITY_THEME,
  toQualityType
} from '@/schemas/quality';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const KeyMetricsCard: React.FC<{
  slug: string;
  participant: SweepstakesParticipantSchema;
}> = ({ participant, slug }) => {
  const type = toQualityType(participant.qualityScore);
  const theme = QUALITY_THEME[type];
  const label = QUALITY_LABELS[type];
  const Icon = QUALITY_ICON[type];

  return (
    <div className="grid gap-4 grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-medium">Total Entries</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/app/${slug}/users/${participant.id}/entries`}>
              <SquareArrowOutUpRight className=" text-muted-foreground" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{participant.entries.length}</div>
          <p className="text-xs text-muted-foreground">
            {participant.engagement}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-medium">Quality Score</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/app/${slug}/users/${participant.id}/risk`}>
              <SquareArrowOutUpRight className=" text-muted-foreground" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-6 w-6', theme.text)} />
            <div className="text-2xl font-bold ">
              {participant.qualityScore}
            </div>
          </div>
          <p className={cn('text-xs text-muted-foreground', theme.text)}>
            {label}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
