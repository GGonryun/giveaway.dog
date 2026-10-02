import { ScrapeBadger } from 'scrapebadger';
import { ApplicationError } from '@/lib/errors';

export const getScrapeBadgerClient = () => {
  const apiKey = process.env.SCRAPEBADGER_API_KEY;

  if (!apiKey) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'SCRAPEBADGER_API_KEY environment variable not set'
    });
  }

  return new ScrapeBadger({ apiKey });
};
