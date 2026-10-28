'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type UpdateSession = ReturnType<typeof useSession>['update'];

export const useUpdateSession = () => {
  const { status, update } = useSession();
  const latest = useRef({ status, update });
  const waiting = useRef<(() => void)[]>([]);

  useEffect(() => {
    latest.current = { status, update };
    if (status === 'loading') return;
    const settle = waiting.current;
    waiting.current = [];
    settle.forEach((resolve) => resolve());
  }, [status, update]);

  const loaded = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiting.current.push(resolve);
      }),
    []
  );

  return useCallback(
    async (data: Parameters<UpdateSession>[0]): Promise<Session | null> => {
      if (latest.current.status === 'loading') await loaded();

      for (;;) {
        const attempted = latest.current.update;
        const session = await attempted(data);
        if (session !== undefined) return session;
        if (latest.current.update === attempted) await loaded();
      }
    },
    [loaded]
  );
};
