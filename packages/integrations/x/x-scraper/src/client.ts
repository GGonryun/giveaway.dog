import 'server-only';

import { ScrapeBadger } from 'scrapebadger';
import { ApplicationError } from '@giveaway/util-errors';
import { isE2eFakeOn } from '@giveaway/e2e-fakes/switch';
import { isE2eGateOpen } from '@giveaway/e2e-gate/gate';
import {
  createScrapeBadgerFixtureClient,
  ScrapeBadgerClient
} from './fixtures';

export const getScrapeBadgerClient = (): ScrapeBadgerClient => {
  if (isE2eFakeOn('scrapebadger')) {
    return createScrapeBadgerFixtureClient();
  }

  if (isE2eGateOpen()) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'ScrapeBadger is off where the e2e gate is open. Add scrapebadger to E2E_FAKE_EXTERNALS'
    });
  }

  const apiKey = process.env.SCRAPEBADGER_API_KEY;

  if (!apiKey) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'SCRAPEBADGER_API_KEY environment variable not set'
    });
  }

  return new ScrapeBadger({ apiKey });
};
