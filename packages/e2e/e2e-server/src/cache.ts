import 'server-only';

import { revalidateTag } from 'next/cache';

const SWEEPSTAKES_TAGS = ['participant-sweepstake', 'winners-leaderboard'];

const LIST_TAGS = [
  'public-sweepstakes-list',
  'historical-sweepstakes-list',
  'browse-hosts',
  'total-engagements'
];

const expire = (tag: string) => revalidateTag(tag, { expire: 0 });

export const expireE2eSweepstakesTags = (
  ids: string[],
  { lists }: { lists: boolean }
) => {
  for (const id of ids) {
    expire(`sweepstakes-${id}`);
    expire(`sweepstakes-${id}-privacy`);
  }
  for (const tag of SWEEPSTAKES_TAGS) expire(tag);
  if (lists) {
    for (const tag of LIST_TAGS) expire(tag);
  }
};
