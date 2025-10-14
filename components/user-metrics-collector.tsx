'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  collectUserMetrics,
  setUserMetricsCookie,
  getUserMetricsCookie
} from '@/lib/user-metrics';
import { useProcedure } from '@/lib/mrpc/hook';
import trackUser from '@/procedures/user/track-user';
import { UserEventType } from '@prisma/client';

export function UserMetricsCollector() {
  const { data: session, status } = useSession();

  const { run: runTrackUser } = useProcedure({
    action: trackUser,
    onFailure(error) {
      console.error('Failed to track user:', error);
    }
  });

  useEffect(() => {
    const existingMetrics = getUserMetricsCookie();
    const cookieExpired = !existingMetrics;

    if (cookieExpired) {
      const metrics = collectUserMetrics();

      if (metrics) {
        setUserMetricsCookie(metrics);

        if (status === 'authenticated' && session?.user) {
          runTrackUser({ type: UserEventType.TRACKING });
        }
      }
    }
  }, [session, status, runTrackUser]);

  return null;
}
