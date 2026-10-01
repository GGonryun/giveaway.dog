import { describe, expect, it } from 'vitest';
import { BannerConfig } from '../types';
import { DemoBanner } from '../demo-banner';
import { renderWithLayout } from './layout-context';

const banner: BannerConfig = {
  title: 'Read only',
  fullMessage: '- This giveaway has ended and can no longer be edited.',
  shortMessage: '- Ended',
  showAction: true,
  actionText: 'Duplicate',
  actionHref: '/app/acme/sweepstakes/new'
};

describe('DemoBanner', () => {
  describe('with a custom banner', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithLayout(<DemoBanner />, { banner });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('in demo mode', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithLayout(<DemoBanner />, {
        action: 'demo'
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
