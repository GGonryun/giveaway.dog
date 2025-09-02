import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { differenceInDays, formatDistanceToNow, isBefore } from 'date-fns';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import {
  ENDING_SOON_SWEEPSTAKE_THRESHOLD,
  NEW_SWEEPSTAKE_THRESHOLD
} from '@/lib/settings';
import React from 'react';
import { ClockIcon, MapPinIcon, Trophy, UsersIcon } from 'lucide-react';
import pluralize from 'pluralize';
import Link from 'next/link';

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
    return <Badge variant="default">{daysLeft} days left</Badge>;
  }
};

export const GiveawayItem: React.FC<{
  sweepstakes: PublicSweepstakeSchema;
}> = ({ sweepstakes }) => {
  const {
    name,
    description,
    banner,
    prizes,
    endDate,
    region,
    featured,
    participants
  } = sweepstakes;

  const isEnded = isBefore(endDate, new Date());

  return (
    <Card
      className={`overflow-hidden pt-0 flex flex-col h-full ${isEnded ? 'opacity-75' : ''}`}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        {banner && (
          <img
            src={banner}
            alt={name}
            className="w-full h-48 object-cover transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 left-3">
          {getStatusBadge(sweepstakes, isEnded)}
        </div>
        {featured && (
          <Badge className="absolute top-3 right-3 bg-primary">Featured</Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3 flex-1">
        <div>
          <Typography.Header
            level={3}
            className="font-semibold text-lg mb-1 line-clamp-1"
          >
            {name}
          </Typography.Header>
          <Typography.Paragraph className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </Typography.Paragraph>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span>
                {isEnded
                  ? `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`
                  : `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>
                {prizes} {pluralize('prize', prizes)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UsersIcon className="w-3 h-3" />
              <span>{participants.toLocaleString()}</span>
            </div>
          </div>

          {region && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinIcon className="w-3 h-3" />
              <span>{region}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          className="w-full"
          variant={isEnded ? 'outline' : 'default'}
          disabled={isEnded}
        >
          <Link href={`/browse/${sweepstakes.id}`} className="w-full">
            {isEnded ? 'Giveaway Ended' : 'Join Giveaway'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
