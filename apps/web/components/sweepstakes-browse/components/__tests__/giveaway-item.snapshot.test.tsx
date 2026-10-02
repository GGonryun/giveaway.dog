import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildPublicSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import type { PublicSweepstakesParticipationSchema } from '@/lib/participant/schemas';
import type { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import { GiveawayItem } from '../giveaway-item';

const renderItem = (
  overrides: Partial<PublicSweepstakeSchema> = {},
  participation?: PublicSweepstakesParticipationSchema[string]
) =>
  render(
    <GiveawayItem
      sweepstakes={buildPublicSweepstakes(overrides)}
      participation={participation}
    />
  );

describe('GiveawayItem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot for a running giveaway with partial participation', () => {
    const { container } = renderItem(
      { featured: true },
      { sweepstakesId: 'sweep-1', completed: 2, maximum: 5 }
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
