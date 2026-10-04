'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { useGiveawayParticipation } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@giveaway/ui-primitives/button';
import { useProcedureAsync } from '@giveaway/rpc-client/hook';
import refreshSweepstakes from '@giveaway/participation-server/refresh-sweepstakes';
import { useRouter } from 'next/navigation';

export const Pending: React.FC = () => {
  const { sweepstakes } = useGiveawayParticipation();
  const [timeLeft, setTimeLeft] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const router = useRouter();
  const refreshProcedure = useProcedureAsync({ action: refreshSweepstakes });

  useEffect(() => {
    const startDate = new Date(sweepstakes.timing.startDate);

    const updateCountdown = () => {
      const now = new Date();

      if (now >= startDate) {
        setHasStarted(true);
        return;
      }

      const distance = formatDistanceToNow(startDate, { addSuffix: true });
      setTimeLeft(distance);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [sweepstakes.timing.startDate]);

  const handleRefresh = async () => {
    // Invalidate all sweepstakes caches
    await refreshProcedure.run({ sweepstakesId: sweepstakes.id });
    // Refresh the current route to get fresh data
    router.refresh();
  };

  return (
    <div className="text-center my-4">
      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">
        {hasStarted ? 'Giveaway Has Started!' : 'Giveaway Starting Soon'}
      </h3>
      {hasStarted ? (
        <>
          <p className="text-muted-foreground mb-4">
            This giveaway is now live. Click below to refresh the page and
            participate.
          </p>
          <Button
            onClick={handleRefresh}
            size="lg"
            disabled={refreshProcedure.isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshProcedure.isLoading ? 'animate-spin' : ''}`}
            />
            {refreshProcedure.isLoading ? 'Refreshing...' : 'Refresh Page'}
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">
          This giveaway will begin {timeLeft}
        </p>
      )}
    </div>
  );
};
