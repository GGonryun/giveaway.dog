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
  CircleCheck
} from 'lucide-react';
import { VisibilityType } from '@prisma/client';
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

import { CompleteSweepstakesAlert } from './complete-sweepstakes-alert';
import {
  DerivedSweepstakeStatus,
  EDITABLE_DERIVED_STATUS
} from '@/schemas/sweepstakes';
import {
  PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY,
  TeamFeatureFlagKeySchema
} from '@/schemas/feature-flags';
import { featureFlags } from '@/lib/feature-flags';

interface SweepstakesStatusProps {
  sweepstakesId: string;
  status: DerivedSweepstakeStatus;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  visibility?: VisibilityType;
  sweepstakesUrl?: string;
  hasAllWinnersSelected?: boolean;
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
  onPickWinners?: () => void;
  onGenerateQR?: () => void;
  onCompleteSweepstakes: () => void;
  isCompleting: boolean;
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
  teamFeatureFlags,
  onPickWinners,
  onGenerateQR,
  onCompleteSweepstakes,
  isCompleting = false,
  hasAllWinnersSelected = false,
  className
}) => {
  const router = useRouter();
  const hasPublicSweepstakesAccess = featureFlags.parseTeam(
    teamFeatureFlags,
    PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY
  );

  const isEditable = EDITABLE_DERIVED_STATUS[status];

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

  const timeInfo = getSweepstakesTimingDescription({
    status,
    startDate,
    endDate
  });

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
        {status === 'COMPLETED' && (
          <Alert variant="success">
            <CircleCheck />
            <AlertTitle>Sweepstakes Completed</AlertTitle>
            <AlertDescription>
              This sweepstakes is complete. It cannot be modified further.
            </AlertDescription>
          </Alert>
        )}

        {status === 'EXPIRED' && hasAllWinnersSelected && (
          <CompleteSweepstakesAlert
            onCompleteAction={onCompleteSweepstakes}
            isCompleting={isCompleting}
          />
        )}

        {status === 'EXPIRED' && !hasAllWinnersSelected && (
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

        {isEditable && visibility === VisibilityType.PRIVATE && (
          <Alert variant="warning">
            <EyeOff />
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
              <div className="flex-1">
                <AlertTitle>Sweepstakes is Private</AlertTitle>
                <AlertDescription>
                  <span>
                    Your sweepstakes is only accessible to other people within
                    your organization. It will not appear on the public browse
                    page.
                    <br />
                    <br />
                    <span className="text-xs font-semibold">
                      Note: Visibility changes can take up to an hour to fully
                      propagate.
                    </span>
                  </span>
                </AlertDescription>
              </div>
              <Select
                value={visibility}
                onValueChange={handleVisibilityChange}
                disabled={isTogglingVisibility}
              >
                <SelectTrigger className="w-full sm:w-34">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasPublicSweepstakesAccess && (
                    <SelectItem value={VisibilityType.PUBLIC}>
                      Public
                    </SelectItem>
                  )}
                  <SelectItem value={VisibilityType.UNLISTED}>
                    Unlisted
                  </SelectItem>
                  <SelectItem value={VisibilityType.PRIVATE}>
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Alert>
        )}

        {isEditable && visibility === VisibilityType.UNLISTED && (
          <Alert variant="info">
            <Eye />
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
              <div className="flex-1">
                <AlertTitle>Sweepstakes is Unlisted</AlertTitle>
                <AlertDescription>
                  <span>
                    Your sweepstakes can be accessed by anyone with the direct
                    link, but will not appear on the public browse page.
                    <br />
                    <br />
                    <span className="text-xs font-semibold">
                      Note: Visibility changes can take up to an hour to fully
                      propagate.
                    </span>
                  </span>
                </AlertDescription>
              </div>
              <Select
                value={visibility}
                onValueChange={handleVisibilityChange}
                disabled={isTogglingVisibility}
              >
                <SelectTrigger className="w-full sm:w-34 shrink-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasPublicSweepstakesAccess && (
                    <SelectItem value={VisibilityType.PUBLIC}>
                      Public
                    </SelectItem>
                  )}
                  <SelectItem value={VisibilityType.UNLISTED}>
                    Unlisted
                  </SelectItem>
                  <SelectItem value={VisibilityType.PRIVATE}>
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Alert>
        )}

        {isEditable && visibility === VisibilityType.PUBLIC && (
          <Alert variant="info">
            <Eye />
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
              <div className="flex-1">
                <AlertTitle>Sweepstakes is Public</AlertTitle>
                <AlertDescription>
                  <span>
                    Your sweepstakes will appear on the browse page and can be
                    discovered and accessed by anyone.
                    <br />
                    <br />
                    <span className="text-xs font-semibold">
                      Note: Visibility changes can take up to an hour to fully
                      propagate.
                    </span>
                  </span>
                </AlertDescription>
              </div>
              <Select
                value={visibility}
                onValueChange={handleVisibilityChange}
                disabled={isTogglingVisibility || !hasPublicSweepstakesAccess}
              >
                <SelectTrigger className="w-full sm:w-34 shrink-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={VisibilityType.PUBLIC}
                    disabled={!hasPublicSweepstakesAccess}
                  >
                    Public
                  </SelectItem>
                  <SelectItem value={VisibilityType.UNLISTED}>
                    Unlisted
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
