import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParticipationHistorySkeleton } from '../participation-history-skeleton';

describe('ParticipationHistorySkeleton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ParticipationHistorySkeleton />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
