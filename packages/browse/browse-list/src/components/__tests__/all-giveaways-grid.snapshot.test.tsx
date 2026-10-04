import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOW } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { AllGiveawaysGrid } from '../all-giveaways-grid';

describe('AllGiveawaysGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot for the empty state', () => {
    const { container } = render(
      <AllGiveawaysGrid sweepstakes={[]} participation={{}} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
