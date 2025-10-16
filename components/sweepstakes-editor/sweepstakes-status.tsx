'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CopyLinkInput } from '@/components/ui/copy-link-input';
import {
  CalendarIcon,
  ClockIcon,
  Trophy,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { isAfter } from 'date-fns';
import { SweepstakesStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { datetime } from '@/lib/date';
import {
  getSweepstakesTimingDescription,
  SweepstakesStatusBadge,
  SweepstakesStatusDescription
} from '../sweepstakes/status-badge';

interface SweepstakesStatusProps {
  status: SweepstakesStatus;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  sweepstakesUrl?: string;
  hasAllWinnersSelected?: boolean;
  onPickWinners?: () => void;
  onGenerateQR?: () => void;
  onCompleteSweepstakes?: () => void;
  isCompleting?: boolean;
  className?: string;
}

export const SweepstakesStatusComponent: React.FC<SweepstakesStatusProps> = ({
  status,
  startDate,
  endDate,
  timeZone,
  sweepstakesUrl = '',
  hasAllWinnersSelected = false,
  onPickWinners,
  onGenerateQR,
  className
}) => {
  const now = new Date();
  const hasEnded = isAfter(now, endDate);

  const getWinnerSelectionStatus = () => {
    if (status === SweepstakesStatus.ACTIVE && !hasEnded) {
      return 'Winners will need to be selected after sweepstakes ends';
    } else if (
      (status === SweepstakesStatus.ACTIVE && hasEnded) ||
      status === SweepstakesStatus.COMPLETED
    ) {
      return hasAllWinnersSelected ? null : 'Pending winner selection';
    }
    return null;
  };

  const timeInfo = getSweepstakesTimingDescription({
    status,
    startDate,
    endDate
  });
  const winnerStatus = getWinnerSelectionStatus();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">
          <SweepstakesStatusDescription
            status={status}
            startDate={startDate}
            endDate={endDate}
          />
        </CardTitle>
        <SweepstakesStatusBadge
          status={status}
          startDate={startDate}
          endDate={endDate}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Selection Status */}
        {winnerStatus && winnerStatus === 'Pending winner selection' && (
          <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-300 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm font-semibold text-red-900">
                    Action Required: Winners Not Selected
                  </div>
                  <div className="text-xs text-red-700 mt-0.5">
                    Your sweepstakes has ended. Select winners now to complete
                    the process.
                  </div>
                </div>
              </div>
              {onPickWinners && (
                <Button
                  onClick={onPickWinners}
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                >
                  Select Winners
                </Button>
              )}
            </div>
          </div>
        )}
        {winnerStatus && winnerStatus !== 'Pending winner selection' && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">{winnerStatus}</div>
          </div>
        )}

        {/* Time Information */}
        <div className="flex items-center gap-3">
          <ClockIcon className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">{timeInfo}</div>
            <div className="text-xs text-muted-foreground">
              {datetime.toTimeZoneDisplay(timeZone)}
            </div>
          </div>
        </div>
        {/* Date Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">Start Date</div>
              <div className="text-sm text-muted-foreground">
                {datetime.format(startDate, 'long')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">End Date</div>
              <div className="text-sm text-muted-foreground">
                {datetime.format(endDate, 'long')}
              </div>
            </div>
          </div>
        </div>

        {/* Sharing Section */}
        {sweepstakesUrl && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="font-medium">Share Sweepstakes</div>
              <div className="flex gap-2">
                <CopyLinkInput
                  value={sweepstakesUrl || ''}
                  placeholder="Sweepstakes URL"
                  className="flex-1"
                />
                {onGenerateQR && (
                  <Button onClick={onGenerateQR} variant="outline" size="icon">
                    <QrCode />
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  disabled={!sweepstakesUrl}
                >
                  <Link
                    href={sweepstakesUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
