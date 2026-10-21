'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  collectUserMetrics,
  setUserMetricsCookie,
  getUserMetricsCookie
} from '@giveaway/request-context-model/user-metrics';
import { useProcedure } from '@giveaway/rpc-client/hook';
import trackUser from '@giveaway/audience-server/track-user';
import { UserEventType } from '@giveaway/db-model';

export function UserMetricsCollector() {
  const { data: session, status } = useSession();
  const tracked = useRef(false);

  const { run: runTrackUser } = useProcedure({
    action: trackUser,
    onFailure(error) {
      console.error('Failed to track user:', error);
    }
  });

  useEffect(() => {
    if (tracked.current) return;

    const existingMetrics = getUserMetricsCookie();
    const cookieExpired = !existingMetrics;

    if (cookieExpired) {
      const metrics = collectUserMetrics();

      if (metrics) {
        setUserMetricsCookie(metrics);

        if (status === 'authenticated' && session?.user) {
          tracked.current = true;
          runTrackUser({ type: UserEventType.TRACKING });
        }
      }
    }
  }, [session, status, runTrackUser]);

  return null;
}
