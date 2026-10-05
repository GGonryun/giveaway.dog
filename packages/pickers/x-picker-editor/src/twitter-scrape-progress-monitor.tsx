'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Loader2, CheckCircle2, AlertCircle, AlarmClock } from 'lucide-react';
import { PickerStatus } from '@giveaway/db-model';
import { shouldShowProgress } from '@giveaway/picker-model/utils/status';

interface TwitterScrapeProgressMonitorProps {
  pickerId: string;
  runId: string | null;
  status: PickerStatus;
}

export const TwitterScrapeProgressMonitor: React.FC<
  TwitterScrapeProgressMonitorProps
> = ({ status }) => {
  const router = useRouter();
  const [refreshLimitReached, setRefreshLimitReached] = useState(false);
  const refreshCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const shouldMonitor = shouldShowProgress(status);

  const isTerminalStatus = (currentStatus: PickerStatus): boolean => {
    return (
      currentStatus === 'COMPLETE' ||
      currentStatus === 'SUSPENDED' ||
      currentStatus === 'CANCELLED' ||
      currentStatus === 'FAILED'
    );
  };

  const getMaxAttempts = (currentStatus: PickerStatus): number => {
    if (currentStatus === 'PROCESSING') {
      return 50;
    }
    return 5;
  };

  useEffect(() => {
    if (!shouldMonitor || refreshLimitReached || isTerminalStatus(status)) {
      return;
    }

    const maxAttempts = getMaxAttempts(status);

    const poll = () => {
      refreshCountRef.current += 1;

      if (refreshCountRef.current >= maxAttempts) {
        setRefreshLimitReached(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        router.refresh();
      }
    };

    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldMonitor, status, router, refreshLimitReached]);

  if (!shouldMonitor) {
    return null;
  }

  if (isTerminalStatus(status)) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Processing Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All entries have been processed successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (refreshLimitReached) {
    return (
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            {status === 'PROCESSING'
              ? 'Processing Taking Longer Than Expected'
              : 'Initialization Taking Longer Than Expected'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please refresh the page manually to check the status.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'SCHEDULED') {
    return (
      <Card className="border-gray-500/50 bg-gray-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-600">
            <AlarmClock className="size-4" />
            Scheduled for Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Picker is scheduled to be processed at a later time...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'PROCESSING') {
    return (
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Loader2 className="size-4 animate-spin" />
            Processing Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fetching and processing participant data...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Initializing Draw
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Starting up the draw process... This will begin processing shortly.
        </p>
      </CardContent>
    </Card>
  );
};
