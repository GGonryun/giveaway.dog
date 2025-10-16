'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CopyLinkInput } from '@/components/ui/copy-link-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  CalendarIcon,
  ClockIcon,
  Trophy,
  QrCode,
  ExternalLink,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { isAfter } from 'date-fns';
import { SweepstakesStatus, VisibilityType } from '@prisma/client';
import { cn } from '@/lib/utils';
import { datetime } from '@/lib/date';
import {
  getSweepstakesTimingDescription,
  SweepstakesStatusBadge,
  SweepstakesStatusDescription
} from '../sweepstakes/status-badge';
import { useProcedure } from '@/lib/mrpc/hook';
import toggleVisibility from '@/procedures/sweepstakes/toggle-visibility';
import { useRouter } from 'next/navigation';
import {
  FeatureFlagKeySchema,
  PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY
} from '@/schemas/feature-flags';
import { featureFlags } from '@/lib/feature-flags';

interface SweepstakesStatusProps {
  sweepstakesId: string;
  status: SweepstakesStatus;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  visibility?: VisibilityType;
  sweepstakesUrl?: string;
  hasAllWinnersSelected?: boolean;
  userFeatureFlags?: FeatureFlagKeySchema[];
  onPickWinners?: () => void;
  onGenerateQR?: () => void;
  onCompleteSweepstakes?: () => void;
  isCompleting?: boolean;
  className?: string;
}

export const SweepstakesStatusComponent: React.FC<SweepstakesStatusProps> = ({
  sweepstakesId,
  status,
  startDate,
  endDate,
  timeZone,
  visibility = VisibilityType.PRIVATE,
  sweepstakesUrl = '',
  hasAllWinnersSelected = false,
  userFeatureFlags = [],
  onPickWinners,
  onGenerateQR,
  className
}) => {
  const router = useRouter();
  const now = new Date();
  const hasEnded = isAfter(now, endDate);
  const hasPublicSweepstakesAccess = featureFlags.parse(
    userFeatureFlags,
    PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY
  );

  const { run: runToggleVisibility, isLoading: isTogglingVisibility } =
    useProcedure({
      action: toggleVisibility,
      onSuccess: () => {
        router.refresh();
      }
    });

  const handleVisibilityChange = (newVisibility: VisibilityType) => {
    runToggleVisibility({
      sweepstakesId,
      visibility: newVisibility
    });
  };

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

        {/* Visibility Section */}
        {visibility === VisibilityType.PRIVATE ? (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <EyeOff className="h-4 w-4 text-red-600" />
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex-1">
                <AlertTitle className="text-red-900">
                  Sweepstakes is Private
                </AlertTitle>
                <AlertDescription className="text-red-800 mt-1">
                  {hasPublicSweepstakesAccess ? (
                    <>
                      Your sweepstakes is currently private. Public sweepstakes
                      can reach more users and appear in our browse page
                      searches. You can keep it private if you want to only
                      reach an internal audience, share with people you know, or
                      your own customers to reduce the reach of your
                      sweepstakes.
                      <br />
                      <br />
                      <span className="text-xs">
                        Note: Visibility changes can take up to an hour to fully
                        propagate.
                      </span>
                    </>
                  ) : (
                    <span>
                      Your sweepstakes is currently{' '}
                      <span className="font-bold">private</span>.
                      <br />
                      You <span className="font-bold">do not</span> have
                      permission to make sweepstakes public.
                      <br />
                      <Link
                        href="/support"
                        className="font-bold underline hover:text-red-900"
                      >
                        Contact support
                      </Link>{' '}
                      to enable this feature for your account.
                    </span>
                  )}
                </AlertDescription>
              </div>
              {hasPublicSweepstakesAccess && (
                <Select
                  value={visibility}
                  onValueChange={handleVisibilityChange}
                  disabled={isTogglingVisibility}
                >
                  <SelectTrigger className="w-32 shrink-0 bg-white border-red-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VisibilityType.PUBLIC}>
                      Public
                    </SelectItem>
                    <SelectItem value={VisibilityType.PRIVATE}>
                      Private
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </Alert>
        ) : (
          <Alert variant="success" className="border-green-300 bg-green-50">
            <Eye className="h-4 w-4 text-green-600" />
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
              <div className="flex-1">
                <AlertTitle className="text-green-900">
                  Sweepstakes is Public
                </AlertTitle>
                <AlertDescription className="text-green-800 mt-1">
                  Your sweepstakes is visible on the browse page and can be
                  discovered by anyone. Visibility changes can take up to an
                  hour to fully propagate.
                </AlertDescription>
              </div>
              <Select
                value={visibility}
                onValueChange={handleVisibilityChange}
                disabled={isTogglingVisibility || !hasPublicSweepstakesAccess}
              >
                <SelectTrigger className="w-full sm:w-32 shrink-0 bg-white border-green-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={VisibilityType.PUBLIC}
                    disabled={!hasPublicSweepstakesAccess}
                  >
                    Public
                  </SelectItem>
                  <SelectItem value={VisibilityType.PRIVATE}>
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Alert>
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
