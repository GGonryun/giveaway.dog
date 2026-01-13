'use client';

import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import { GiveawayItem } from './giveaway-item';
import { Typography } from '@/components/ui/typography';
import pluralize from 'pluralize';
import { PublicSweepstakesParticipationSchema } from '@/lib/participant/schemas';

interface AllGiveawaysGridProps {
  sweepstakes: PublicSweepstakeSchema[];
  participation: PublicSweepstakesParticipationSchema;
}

export function AllGiveawaysGrid({
  sweepstakes = [],
  participation = {}
}: AllGiveawaysGridProps) {
  if (sweepstakes.length === 0) {
    return (
      <div className="text-center py-12">
        <Typography.Header level={3} className="text-xl font-semibold mb-2">
          No giveaways found
        </Typography.Header>
        <Typography.Paragraph className="text-muted-foreground">
          Try adjusting your search or filters to find more giveaways.
        </Typography.Paragraph>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography.Paragraph className="text-sm text-muted-foreground">
          Showing {sweepstakes.length}{' '}
          {pluralize('giveaway', sweepstakes.length)}
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sweepstakes.map((sweepstake) => {
          return (
            <div key={sweepstake.id}>
              <GiveawayItem
                sweepstakes={sweepstake}
                participation={participation[sweepstake.id]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
