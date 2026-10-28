import 'server-only';

import { requestTimeout } from '@giveaway/util-time/request-timeout';

type FetchSession = {
  readonly did?: string;
  fetchHandler(url: string, init?: RequestInit): Promise<Response>;
};

export const withRequestTimeout = (session: FetchSession) => ({
  did: session.did,
  fetchHandler: (url: string, init?: RequestInit) =>
    session.fetchHandler(url, {
      ...init,
      signal: requestTimeout(undefined, init?.signal)
    })
});
