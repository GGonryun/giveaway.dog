import 'server-only';

import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { getScrapeBadgerClient } from '../client';
import { scrapeBadgerUserSchema, type ScrapeBadgerUser } from '../schemas';

export const getUser = async ({
  username
}: {
  username: string;
}): Promise<ScrapeBadgerUser> => {
  console.info(`[ScrapeBadger] Fetching user details for username ${username}`);

  return parseProviderResponse({
    provider: 'scrapebadger',
    call: 'users.getByUsername',
    schema: scrapeBadgerUserSchema,
    data: await getScrapeBadgerClient().twitter.users.getByUsername(username)
  });
};
