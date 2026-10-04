import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Badge } from '@giveaway/ui-primitives/badge';
import { Typography } from '@giveaway/ui-primitives/typography';
import { formatDistanceToNowStrict, isBefore } from 'date-fns';
import { PublicSweepstakeSchema } from '@giveaway/sweepstakes-model/public';
import React from 'react';
import Link from 'next/link';
import { date } from '@giveaway/util-time/date';
import { cn } from '@giveaway/ui-utils/utils';
import { SweepstakesStatusSummaryBadge } from '@/components/sweepstakes/status-badge';
import { PublicSweepstakesParticipationSchema } from '@giveaway/participant-model/schemas';
import { Check } from 'lucide-react';

export const GiveawayItem: React.FC<{
  sweepstakes: PublicSweepstakeSchema;
  participation?: PublicSweepstakesParticipationSchema[string];
}> = ({ sweepstakes, participation }) => {
  const { id, name, slug, banner, endDate, startDate, featured, status, host } =
    sweepstakes;

  const isEnded = date.hasExpired(new Date(endDate));
  const isPending = isBefore(new Date(), new Date(startDate));

  return (
    <Link href={`/browse/${slug ?? id}`}>
      <Card
        className={cn(
          'group overflow-hidden pt-0  flex flex-col h-full hover:scale-[1.03] transition-transform duration-200',
          isEnded ? 'opacity-75' : ''
        )}
      >
        <div className="relative overflow-hidden rounded-t-lg">
          {banner && (
            <img
              src={banner}
              alt={name}
              className="w-full aspect-video object-cover transition-transform duration-300"
            />
          )}
          <div className="absolute top-3 left-3">
            <SweepstakesStatusSummaryBadge
              startDate={startDate}
              endDate={endDate}
              status={status}
            />
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {featured && <Badge className="bg-primary">Featured</Badge>}
            {participation && participation.completed > 0 && (
              <Badge
                className={cn(
                  'bg-green-600 hover:bg-green-700 text-white flex items-center gap-1',
                  participation.completed === participation.maximum &&
                    'bg-green-700 hover:bg-green-800'
                )}
              >
                {participation.completed === participation.maximum ? (
                  <>
                    <Check className="w-3 h-3" />
                    Done
                  </>
                ) : (
                  <>
                    {participation.completed}/{participation.maximum}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="flex-1">
          <Typography.Header
            level={3}
            leading="none"
            className="font-semibold text-lg line-clamp-1 group-hover:underline group-hover:text-success"
          >
            {name}
          </Typography.Header>
          <Typography className="text-sm text-muted-foreground" leading="none">
            {isPending
              ? `Starts ${formatDistanceToNowStrict(startDate, { addSuffix: true })}`
              : `${formatDistanceToNowStrict(endDate)} ${isBefore(endDate, new Date()) ? 'ago' : 'left'}`}{' '}
            • by {host.name}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};
