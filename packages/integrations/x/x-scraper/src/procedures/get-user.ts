import 'server-only';

import { getScrapeBadgerClient } from '../client';
import type { User } from 'scrapebadger';

export const getUser = async ({
  username
}: {
  username: string;
}): Promise<User> => {
  console.info(`[ScrapeBadger] Fetching user details for username ${username}`);

  return await getScrapeBadgerClient().twitter.users.getByUsername(username);
};
