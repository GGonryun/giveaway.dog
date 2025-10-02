import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import {
  ENDING_SOON_SWEEPSTAKE_THRESHOLD,
  NEW_SWEEPSTAKE_THRESHOLD
} from '@/lib/settings';
import React from 'react';
import Link from 'next/link';
import { date } from '@/lib/date';
import { cn } from '@/lib/utils';

const getStatusBadge = (
  { startDate, endDate }: Pick<PublicSweepstakeSchema, 'endDate' | 'startDate'>,
  isEnded: boolean
) => {
  if (isEnded) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Ended
      </Badge>
    );
  }

  const daysLeft = differenceInDays(endDate, new Date());
  const isEndingSoon = daysLeft <= ENDING_SOON_SWEEPSTAKE_THRESHOLD;
  const isNew =
    differenceInDays(new Date(), startDate) <= NEW_SWEEPSTAKE_THRESHOLD;

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
  const { name, description, banner, endDate, featured } = sweepstakes;

  const isEnded = date.hasExpired(new Date(endDate));

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
            {formatDistanceToNow(endDate)} left ‧ by {sweepstakes.host.name}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};
