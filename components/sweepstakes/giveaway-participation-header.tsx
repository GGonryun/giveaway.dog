'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, ClockIcon, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';
import { HostInfoCard } from './participation-header/host-info-card';

export const GiveawayParticipationHeader: React.PC = ({ children }) => {
  const { sweepstakes, host } = useGiveawayParticipation();

  return (
    <Card className="relative p-0 m-0 gap-0 overflow-hidden w-full">
      <TimeRemainingBanner />
      <TopBadges />
      <Description />

      <CardContent className="px-4 py-4 border-t border-b">
        {children}
      </CardContent>
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

const TimeRemainingBanner = () => {
  const { sweepstakes, participation } = useGiveawayParticipation();
  const now = new Date();
  const startDate = format(sweepstakes.timing.startDate, 'MMM d, yyyy');
  const endDate = format(sweepstakes.timing.endDate, 'MMM d, yyyy');
  const hasEnded = isAfter(now, endDate);
  const isUpcoming = isBefore(now, startDate);

  return (
    <CardContent className="mt-2 pt-2 pb-2 px-4">
      <div className="flex flex-row  gap-x-4 gap-y-2 mb-2">
        <div className="hidden sm:flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground font-semibold">
            {startDate} - {endDate}
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
        <div className="flex gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">
            {participation.totalEntries} total entries
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
        {sweepstakes.setup.name}
      </h1>
    </CardContent>
  );
};

const TopBadges = () => {
  const { sweepstakes, host } = useGiveawayParticipation();

  const now = new Date();
  const startDate = format(sweepstakes.timing.startDate, 'MMM d, yyyy');
  const endDate = format(sweepstakes.timing.endDate, 'MMM d, yyyy');
  const hasEnded = isAfter(now, endDate);
  const isUpcoming = isBefore(now, startDate);
  return (
    <CardContent className="relative px-4">
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

      {sweepstakes.setup.banner && (
        <div className="relative">
          <div className="overflow-hidden rounded-lg aspect-video flex w-full">
            <img
              src={sweepstakes.setup.banner}
              alt={sweepstakes.setup.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mt-4 ">
        <HostInfoCard host={host} />
      </div>
    </CardContent>
  );
};

const Description = () => {
  const { sweepstakes } = useGiveawayParticipation();

  return (
    <CardContent className="py-4">
      {sweepstakes.setup.description && (
        <p className="text-sm sm:text-base">{sweepstakes.setup.description}</p>
      )}
    </CardContent>
  );
};
