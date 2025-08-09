'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Users } from 'lucide-react';
import Link from 'next/link';
import { useGiveawayParticipation } from './giveaway-participation-context';

// Utility function to calculate time remaining
function calculateTimeRemaining(endDate: Date) {
  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return { value: 0, unit: 'seconds', expired: true };
  }

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0)
    return {
      value: months,
      unit: months === 1 ? 'month' : 'months',
      expired: false
    };
  if (weeks > 0)
    return {
      value: weeks,
      unit: weeks === 1 ? 'week' : 'weeks',
      expired: false
    };
  if (days > 0)
    return { value: days, unit: days === 1 ? 'day' : 'days', expired: false };
  if (hours > 0)
    return {
      value: hours,
      unit: hours === 1 ? 'hour' : 'hours',
      expired: false
    };
  if (minutes > 0)
    return {
      value: minutes,
      unit: minutes === 1 ? 'minute' : 'minutes',
      expired: false
    };
  return {
    value: seconds,
    unit: seconds === 1 ? 'second' : 'seconds',
    expired: false
  };
}

// Utility function to calculate time until start
function calculateTimeUntilStart(startDate: Date) {
  const now = new Date();
  const timeDiff = startDate.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return null; // Already started
  }

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0)
    return { value: months, unit: months === 1 ? 'month' : 'months' };
  if (weeks > 0) return { value: weeks, unit: weeks === 1 ? 'week' : 'weeks' };
  if (days > 0) return { value: days, unit: days === 1 ? 'day' : 'days' };
  if (hours > 0) return { value: hours, unit: hours === 1 ? 'hour' : 'hours' };
  if (minutes > 0)
    return { value: minutes, unit: minutes === 1 ? 'minute' : 'minutes' };
  return { value: seconds, unit: seconds === 1 ? 'second' : 'seconds' };
}

export const GiveawayParticipationHeader: React.FC = () => {
  const { giveaway, user, host, participation } = useGiveawayParticipation();

  const timeRemaining = useMemo(() => {
    return calculateTimeRemaining(giveaway.timing.endDate);
  }, [giveaway.timing.endDate]);

  const timeUntilStart = useMemo(() => {
    return calculateTimeUntilStart(giveaway.timing.startDate);
  }, [giveaway.timing.startDate]);

  return (
    <Card>
      {/* Top badges */}
      <div className="p-4 pb-0">
        <div className="flex flex-wrap gap-2 justify-between">
          <Badge variant="secondary" className="text-xs">
            Giveaway
          </Badge>
          <Badge
            variant={
              timeUntilStart
                ? 'secondary'
                : timeRemaining.expired
                  ? 'destructive'
                  : 'default'
            }
            className={`text-xs ${
              timeUntilStart ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
            }`}
          >
            <Clock className="h-3 w-3 mr-1" />
            {timeUntilStart
              ? `Starting in ${timeUntilStart.value} ${timeUntilStart.unit}`
              : timeRemaining.expired
                ? 'Ended'
                : `${timeRemaining.value} ${timeRemaining.unit} left`}
          </Badge>
        </div>
      </div>

      {giveaway.setup.banner && (
        <div className="relative mx-4 mb-4">
          {/* Banner Image */}
          <div className="h-48 sm:h-64 overflow-hidden rounded-lg">
            <img
              src={giveaway.setup.banner}
              alt={giveaway.setup.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {giveaway.setup.name}
        </h1>

        {/* Host Info */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
            {host.avatar?.startsWith('http') ? (
              <img
                src={host.avatar}
                alt={host.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <span>{host.avatar || '🐕'}</span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Hosted by{' '}
            {host.id ? (
              <Link
                href={`/hosts/${host.id}`}
                className="font-medium hover:underline text-blue-600 hover:text-blue-800"
              >
                {host.name}
              </Link>
            ) : (
              <span className="font-medium">{host.name}</span>
            )}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-4">
          {user && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Your entries:{' '}
                <span className="font-medium">
                  {user.participation.entries}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Total entries:{' '}
              <span className="font-medium">{participation.totalEntries}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Ends:{' '}
              <span className="font-medium">
                {giveaway.timing.endDate.toLocaleDateString()}
              </span>
            </span>
          </div>
        </div>

        {/* Description */}
        {giveaway.setup.description && (
          <>
            <Separator className="my-4" />
            <p className="text-muted-foreground">
              {giveaway.setup.description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
