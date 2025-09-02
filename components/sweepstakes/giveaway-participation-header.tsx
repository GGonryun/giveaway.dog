'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Users,
  Award,
  ExternalLinkIcon,
  ClockIcon,
  CalendarIcon
} from 'lucide-react';
import Link from 'next/link';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';

export const GiveawayParticipationHeader: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { giveaway, host, participation } = useGiveawayParticipation();

  const now = new Date();
  const startDate = giveaway.timing.startDate;
  const endDate = giveaway.timing.endDate;

  const hasEnded = isAfter(now, endDate);
  const isUpcoming = isBefore(now, startDate);

  return (
    <Card className="relative p-0 m-0 gap-0 overflow-hidden w-full">
      {/* Time Remaining Banner */}
      <CardContent className="pt-4 pb-2 px-4">
        <div className="flex flex-row  gap-x-4 gap-y-2 mb-2">
          <div className="hidden sm:flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground font-semibold">
              {format(startDate, 'MMM d, yyyy')} -{' '}
              {format(endDate, 'MMM d, yyyy')}
            </div>
          </div>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 bg-muted-foreground hidden sm:block"
          />
          <div className="flex gap-1">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground font-semibold">
              {isUpcoming
                ? `Starts in ${formatDistanceToNow(startDate)}`
                : hasEnded
                  ? 'Giveaway Ended'
                  : `${formatDistanceToNow(endDate)} left`}
            </div>
          </div>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 bg-muted-foreground hidden sm:block"
          />
          <div className="flex  gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold">
              {participation.totalEntries} total entries
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          {giveaway.setup.name}
        </h1>
      </CardContent>

      <CardContent className="relative px-4">
        {/* Top badges */}
        <div className="absolute z-10 right-6 top-2">
          <Badge
            variant={
              isUpcoming ? 'secondary' : hasEnded ? 'destructive' : 'default'
            }
            className={`text-xs ${
              isUpcoming ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
            }`}
          >
            <Clock className="h-3 w-3 mr-1" />
            {isUpcoming
              ? `Starts in ${formatDistanceToNow(startDate)}`
              : hasEnded
                ? 'Ended'
                : `${formatDistanceToNow(endDate)} left`}
          </Badge>
        </div>

        {giveaway.setup.banner && (
          <div className="relative">
            {/* Banner Image */}
            <div className="overflow-hidden rounded-lg aspect-video flex w-full">
              <img
                src={giveaway.setup.banner}
                alt={giveaway.setup.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Host Info Card */}
        <div className="mt-4 p-2 bg-sidebar border rounded-lg">
          <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 sm:items-center justify-between">
            <div className="flex gap-3">
              <span className="text-4xl">
                {host.avatar || DEFAULT_TEAM_LOGO}
              </span>
              <div className="flex flex-col">
                <div className="text-md text-muted-foreground">
                  Hosted by <span className="font-semibold">{host.name}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {/* TODO: Replace with actual giveaway count */}
                      12 giveaways
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-1"
              asChild
            >
              <Link href={`/hosts/${host.slug}`}>
                <ExternalLinkIcon className="h-3 w-3" />
                See More
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Prizes Section */}
      <CardContent className="p-4 border-b">
        {giveaway.prizes && giveaway.prizes.length > 0 && (
          <div className="flex flex-col items-start gap-0 mb-4">
            <h3 className="font-semibold text-gray-900">Prizes:</h3>
            <ul className="space-y-1">
              {giveaway.prizes.map((prize, index) => (
                <li
                  key={prize.id || index}
                  className="flex items-start gap-2 ml-4 text-sm"
                >
                  <span className="text-muted-foreground text-sm">•</span>
                  <span className="text text-muted-foreground flex-1">
                    {prize.name || `Prize ${index + 1}`}
                    {prize.winners && prize.winners > 1 && (
                      <span className="text-xs ml-1 text-gray-500">
                        ({prize.winners} winners)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description Section */}
        {giveaway.setup.description && (
          <p className="text">{giveaway.setup.description}</p>
        )}
      </CardContent>

      <CardContent className="px-4 py-6 border-b">{children}</CardContent>
      <CardContent className="pt-2 px-4">
        <div className="flex flex-row items-center justify-center gap-x-4 gap-y-2 mb-2">
          <Link className="text-xs" href="/policy">
            Terms & Conditions
          </Link>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 bg-muted-foreground"
          />
          <Link className="text-xs" href="/policy">
            © {host.name}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
