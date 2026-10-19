import 'server-only';

import { getScrapeBadgerClient } from '../client';
import { parseScrapeBadgerResponse } from '../parse';
import { scrapeBadgerUserSchema } from '../schemas';
import type { User } from 'scrapebadger';

export const getUser = async ({
  username
}: {
  username: string;
}): Promise<User> => {
  console.info(`[ScrapeBadger] Fetching user details for username ${username}`);

  const user =
    await getScrapeBadgerClient().twitter.users.getByUsername(username);

  return parseScrapeBadgerResponse(scrapeBadgerUserSchema, user, 'user');
};
