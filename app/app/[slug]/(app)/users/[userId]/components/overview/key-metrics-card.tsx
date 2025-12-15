'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SquareArrowOutUpRight } from 'lucide-react';

import { QUALITY_LABELS, toQualityType } from '@/schemas/quality';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';

export const KeyMetricsCard: React.FC<{
  slug: string;
  engagement: number;
  participant: SweepstakesParticipantSchema;
}> = ({ participant, slug, engagement }) => {
  const type = toQualityType(participant.user.qualityScore);
  const label = QUALITY_LABELS[type];

  return (
    <div className="grid gap-4 grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-medium">Total Entries</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/app/${slug}/users/${participant.user.id}/entries`}>
              <SquareArrowOutUpRight className=" text-muted-foreground" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {participant.completions.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {engagement}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-medium">Quality Score</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/app/${slug}/users/${participant.user.id}/risk`}>
              <SquareArrowOutUpRight className=" text-muted-foreground" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold ">
              {participant.user.qualityScore}
            </div>
          </div>
          <p className={'text-xs text-muted-foreground'}>{label}</p>
        </CardContent>
      </Card>
    </div>
  );
};
