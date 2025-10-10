import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import {
  differenceInDays,
  formatDistanceToNowStrict,
  isBefore
} from 'date-fns';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import {
  ENDING_SOON_SWEEPSTAKE_THRESHOLD,
  NEW_SWEEPSTAKE_THRESHOLD,
  STARTING_SOON_SWEEPSTAKE_THRESHOLD
} from '@/lib/settings';
import React from 'react';
import Link from 'next/link';
import { date } from '@/lib/date';
import { cn } from '@/lib/utils';

const getStatusBadge = (
  { startDate, endDate }: Pick<PublicSweepstakeSchema, 'endDate' | 'startDate'>,
  isEnded: boolean
) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isEnded) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Ended
      </Badge>
    );
  }

  const daysUntilStart = differenceInDays(start, now);
  const isStartingSoon =
    isBefore(now, start) &&
    daysUntilStart <= STARTING_SOON_SWEEPSTAKE_THRESHOLD;

  if (isStartingSoon) {
    return <Badge variant="default">Starting Soon</Badge>;
  }

  const daysLeft = differenceInDays(end, now);
  const isEndingSoon = daysLeft <= ENDING_SOON_SWEEPSTAKE_THRESHOLD;
  const isNew = differenceInDays(now, start) <= NEW_SWEEPSTAKE_THRESHOLD;

  if (isEndingSoon) {
    return <Badge variant="destructive">Ending Soon</Badge>;
  } else if (isNew) {
    return <Badge variant="secondary">New</Badge>;
  } else {
    return null;
  }
};

export const GiveawayItem: React.FC<{
  sweepstakes: PublicSweepstakeSchema;
}> = ({ sweepstakes }) => {
  const { name, banner, endDate, startDate, featured } = sweepstakes;

  const isEnded = date.hasExpired(new Date(endDate));
  const isPending = isBefore(new Date(), new Date(startDate));

  return (
    <Link href={`/browse/${sweepstakes.id}`}>
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
            {getStatusBadge(sweepstakes, isEnded)}
          </div>
          {featured && (
            <Badge className="absolute top-3 right-3 bg-primary">
              Featured
            </Badge>
          )}
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
              : `${formatDistanceToNowStrict(endDate)} ${isBefore(endDate, new Date()) ? 'ago' : 'left'}`}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};
