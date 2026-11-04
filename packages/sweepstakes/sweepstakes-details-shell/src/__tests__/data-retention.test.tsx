import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TeamTier } from '@giveaway/db-model';
import { DataRetentionNotice } from '../data-retention-notice';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const DELETES_AT = new Date('2026-12-30T12:00:00.000Z');

describe('the data retention notice of an ended giveaway', () => {
  it('[RETAIN-007] shows its host the date of the deletion and an offer to upgrade', () => {
    render(
      <DataRetentionNotice
        tier={TeamTier.FREE}
        deletesAt={DELETES_AT}
        deletedAt={null}
      />
    );

    expect(
      screen.getByText(
        'The entries of this giveaway are deleted on December 30, 2026'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Free teams keep the entries of a giveaway for 90 days/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Upgrade to keep the entries longer' })
    ).toHaveAttribute('href', '/pricing');
  });

  it('[RETAIN-007] names the retention period of a Pro team', () => {
    render(
      <DataRetentionNotice
        tier={TeamTier.PRO}
        deletesAt={DELETES_AT}
        deletedAt={null}
      />
    );

    expect(
      screen.getByText(/Pro teams keep the entries of a giveaway for 365 days/)
    ).toBeInTheDocument();
  });

  it('says when the entries were deleted, without an offer to upgrade', () => {
    render(
      <DataRetentionNotice
        tier={TeamTier.FREE}
        deletesAt={null}
        deletedAt={DELETES_AT}
      />
    );

    expect(
      screen.getByText('The entries of this giveaway were deleted')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/deleted on December 30, 2026/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows nothing for a giveaway whose data is kept', () => {
    const { container } = render(
      <DataRetentionNotice
        tier={TeamTier.ELITE}
        deletesAt={null}
        deletedAt={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
