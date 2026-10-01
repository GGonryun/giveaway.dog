import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAllocations,
  buildGiveawayPrize,
  buildHost,
  buildParticipant,
  buildParticipation,
  buildSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import { AuthenticatedSweepstakesContent } from '../authenticated-sweepstakes-content';
import { PublicSweepstakesContent } from '../public-sweepstakes-content';
import { SweepstakesParticipationPage } from '../sweepstakes-participation-page-content';

vi.mock('../sweepstakes-participation-page-content', () => ({
  SweepstakesParticipationPage: vi.fn(() => <div>participation page</div>)
}));

const publicProps = {
  sweepstakes: buildSweepstakes(),
  host: buildHost(),
  prizes: [buildGiveawayPrize()],
  participation: buildParticipation()
};

const privateProps = {
  participant: buildParticipant(),
  relationship: { loyalty: 3 },
  referral: {
    id: 'referral-1',
    code: 'FRIEND42',
    link: 'https://x',
    referrals: []
  },
  allocations: buildAllocations()
};

const lastPageProps = () =>
  vi.mocked(SweepstakesParticipationPage).mock.lastCall?.[0];

describe('sweepstakes content wrappers', () => {
  beforeEach(() => {
    vi.mocked(SweepstakesParticipationPage).mockClear();
  });

  describe('AuthenticatedSweepstakesContent', () => {
    it('passes every prop, including the user data, to the participation page', () => {
      const { container } = render(
        <AuthenticatedSweepstakesContent {...publicProps} {...privateProps} />
      );
      expect(container).toHaveTextContent('participation page');
      expect(lastPageProps()).toEqual({ ...publicProps, ...privateProps });
    });
  });

  describe('PublicSweepstakesContent', () => {
    it('passes only the public props to the participation page', () => {
      const props = { ...publicProps, ...privateProps };
      render(<PublicSweepstakesContent {...props} />);
      expect(lastPageProps()).toEqual(publicProps);
    });
  });
});
