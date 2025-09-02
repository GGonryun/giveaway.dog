'use client';

import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import { GiveawayItem } from './giveaway-item';
import { Typography } from '@/components/ui/typography';

interface AllGiveawaysGridProps {
  sweepstakes: PublicSweepstakeSchema[];
  searchQuery?: string;
}

export function AllGiveawaysGrid({
  searchQuery = '',
  sweepstakes = []
}: AllGiveawaysGridProps) {
  const isEnded = (endDate: Date) => endDate.getTime() < Date.now();

  let filteredGiveaways = sweepstakes.filter((giveaway) => {
    const matchesSearch =
      searchQuery === '' ||
      giveaway.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      giveaway.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

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
          Showing {filteredGiveaways.length} giveaways
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sweepstakes.map((sweepstake) => {
          return (
            <div key={sweepstake.id}>
              <GiveawayItem sweepstakes={sweepstake} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
