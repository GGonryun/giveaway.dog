import { describe, it, expect } from 'vitest';
import { CREDIT_COSTS, SCRAPEBADGER_CREDIT_LIMIT } from '../settings';

describe('scrapebadger settings', () => {
  it('charges one credit for loading a tweet', () => {
    expect(CREDIT_COSTS.LOAD_TWEET_ENDPOINT).toBe(1);
  });

  it('charges one credit for picking winners', () => {
    expect(CREDIT_COSTS.PICK_WINNERS_ENDPOINT).toBe(1);
  });

  it('defines costs only for the public picker endpoints', () => {
    expect(Object.keys(CREDIT_COSTS)).toEqual([
      'LOAD_TWEET_ENDPOINT',
      'PICK_WINNERS_ENDPOINT'
    ]);
  });

  it('allows twenty credits per day', () => {
    expect(SCRAPEBADGER_CREDIT_LIMIT).toBe(20);
  });
});
