import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParticipationHistorySkeleton } from '../participation-history-skeleton';

describe('ParticipationHistorySkeleton', () => {
  it('renders the same columns as the history table', () => {
    render(<ParticipationHistorySkeleton />);

    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    ).toEqual(['Giveaway', 'Progress', 'Status', 'Last Activity']);
  });

  it('renders ten placeholder rows', () => {
    render(<ParticipationHistorySkeleton />);

    const [, body] = screen.getAllByRole('rowgroup');
    expect(within(body).getAllByRole('row')).toHaveLength(10);
  });

  it('renders placeholders instead of text in every row', () => {
    render(<ParticipationHistorySkeleton />);

    const [, body] = screen.getAllByRole('rowgroup');
    expect(body).toHaveTextContent('');
  });
});
