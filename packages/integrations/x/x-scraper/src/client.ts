import 'server-only';

import { ScrapeBadger } from 'scrapebadger';
import { ApplicationError } from '@giveaway/util-errors';
import { isE2eFakeOn } from '@giveaway/e2e-fakes/switch';
import {
  createScrapeBadgerFixtureClient,
  ScrapeBadgerClient
} from './fixtures';

export const getScrapeBadgerClient = (): ScrapeBadgerClient => {
  if (isE2eFakeOn('scrapebadger')) {
    return createScrapeBadgerFixtureClient();
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
