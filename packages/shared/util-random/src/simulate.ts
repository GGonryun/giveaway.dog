import { rng } from './rng';
import { time } from '@giveaway/util-time/time';

export const simulateNetworkDelay = async (n?: number): Promise<unknown> => {
  if (n) return await time.wait(n);
  await time.wait(rng.randomBetween(200, 1000));
};
