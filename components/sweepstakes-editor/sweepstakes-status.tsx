'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CopyLinkInput } from '@/components/ui/copy-link-input';
import {
  CalendarIcon,
  ClockIcon,
  Trophy,
  Users,
  QrCode,
  ExternalLink,
  Share2,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { SweepstakesStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { datetime } from '@/lib/date';

interface SweepstakesStatusProps {
  status: SweepstakesStatus;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  sweepstakesUrl?: string;
  onPickWinners?: () => void;
  onAnnounceWinners?: () => void;
  onGenerateQR?: () => void;
  className?: string;
}

const getStatusConfig = (
  status: SweepstakesStatus,
  startDate: Date,
  endDate: Date
) => {
  const now = new Date();
  const hasStarted = isAfter(now, startDate);
  const hasEnded = isAfter(now, endDate);

  switch (status) {
    case SweepstakesStatus.DRAFT:
      return {
        label: 'Draft',
        variant: 'secondary' as const,
        description: 'Your sweepstakes is being prepared'
      };
    case SweepstakesStatus.PAUSED:
      return {
        label: 'Paused',
        variant: 'outline' as const,
        description: 'Your sweepstakes is temporarily paused'
      };
    case SweepstakesStatus.CANCELED:
      return {
        label: 'Cancelled',
        variant: 'destructive' as const,
        description: 'Your sweepstakes has been cancelled'
      };
    case SweepstakesStatus.ACTIVE:
      if (!hasStarted) {
        return {
          label: 'Scheduled',
          variant: 'outline' as const,
          description: 'Your sweepstakes is scheduled to start'
        };
      } else if (hasEnded) {
        return {
          label: 'Ended',
          variant: 'secondary' as const,
          description: 'Your sweepstakes has ended'
        };
      } else {
        return {
          label: 'Active',
          variant: 'default' as const,
          description: 'Your sweepstakes is live'
        };
      }
    case SweepstakesStatus.COMPLETED:
      return {
        label: 'Completed',
        variant: 'default' as const,
        description: 'Your sweepstakes is complete'
      };
    default:
      return {
        label: 'Unknown',
        variant: 'secondary' as const,
        description: 'Status unknown'
      };
  }
};

export const SweepstakesStatusComponent: React.FC<SweepstakesStatusProps> = ({
  status,
  startDate,
  endDate,
  timeZone,
  sweepstakesUrl = '',
  onPickWinners,
  onAnnounceWinners,
  onGenerateQR,
  className
}) => {
  const statusConfig = getStatusConfig(status, startDate, endDate);
  const now = new Date();
  const hasStarted = isAfter(now, startDate);
  const hasEnded = isAfter(now, endDate);
  const showWinnerActions =
    status === SweepstakesStatus.COMPLETED ||
    (status === SweepstakesStatus.ACTIVE && hasEnded);

  const formatDateInTimeZone = (date: Date) => {
    try {
      // Use toLocaleString to format date with timezone
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(date);
    } catch (error) {
      // Fallback to basic format if timezone is invalid
      return datetime.format(date, 'long');
    }
  };

  const getTimezoneDisplay = () => {
    try {
      const date = new Date();

      // Calculate GMT offset manually
      const utcDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'UTC' })
      );
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      const offsetMs = utcDate.getTime() - tzDate.getTime();
      const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
      const offsetMinutes = Math.floor(
        (Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60)
      );
      const offsetSign = offsetMs <= 0 ? '+' : '-';
      const gmtOffset = `GMT${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

      // Get the long timezone name
      const longName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'long'
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;

      // Format as "(GMT-08:00) Pacific Standard Time"
      if (longName) {
        return `(${gmtOffset}) ${longName}`;
      }

      // Fallback to short format with offset
      const shortName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;

      return shortName ? `(${gmtOffset}) ${shortName}` : timeZone;
    } catch (error) {
      return timeZone;
    }
  };

  const getTimeInfo = () => {
    if (!hasStarted) {
      return {
        text: `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`,
        icon: ClockIcon
      };
    } else if (!hasEnded) {
      return {
        text: `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`,
        icon: ClockIcon
      };
    } else {
      return {
        text: `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`,
        icon: Clock
      };
    }
  };

  const getWinnerSelectionStatus = () => {
    if (status === SweepstakesStatus.ACTIVE && !hasEnded) {
      return 'Winners will need to be selected after sweepstakes ends';
    } else if (
      (status === SweepstakesStatus.ACTIVE && hasEnded) ||
      status === SweepstakesStatus.COMPLETED
    ) {
      return 'Pending winner selection';
    }
    return null;
  };

  const timeInfo = getTimeInfo();
  const winnerStatus = getWinnerSelectionStatus();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{statusConfig.description}</CardTitle>
          <Badge variant={statusConfig.variant} className="text-sm">
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Information */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <timeInfo.icon className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">{timeInfo.text}</div>
            <div className="text-xs text-muted-foreground">
              {getTimezoneDisplay()}
            </div>
          </div>
        </div>

        {/* Winner Selection Status */}
        {winnerStatus && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">{winnerStatus}</div>
          </div>
        )}

        {/* Date Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Start Date</div>
              <div className="text-sm text-muted-foreground">
                {formatDateInTimeZone(startDate)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">End Date</div>
              <div className="text-sm text-muted-foreground">
                {formatDateInTimeZone(endDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Sharing Section */}
        {sweepstakesUrl && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Share Sweepstakes</span>
              </div>
              <div className="flex gap-2">
                <CopyLinkInput
                  value={sweepstakesUrl || ''}
                  placeholder="Sweepstakes URL"
                  className="flex-1"
                />
                {onGenerateQR && (
                  <Button
                    onClick={onGenerateQR}
                    variant="outline"
                    className="shrink-0"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="shrink-0"
                  disabled={!sweepstakesUrl}
                >
                  <Link
                    href={sweepstakesUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Winner Management */}
        {showWinnerActions && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Winner Management</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {onPickWinners && (
                  <Button
                    onClick={onPickWinners}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Pick Winners
                  </Button>
                )}
                {onAnnounceWinners && (
                  <Button
                    onClick={onAnnounceWinners}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Announce Winners
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
