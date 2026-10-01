import { screen } from '@testing-library/react';
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
    it('shows the title with the full and short messages', () => {
      renderWithLayout(<DemoBanner />, { banner });
      const alert = screen.getByRole('alert');
      expect(screen.getByText('Read only').tagName).toBe('STRONG');
      expect(alert).toHaveTextContent(
        '- This giveaway has ended and can no longer be edited.'
      );
      expect(alert).toHaveTextContent('- Ended');
    });

    it('links the action to the configured page', () => {
      renderWithLayout(<DemoBanner />, { banner });
      expect(screen.getByRole('link', { name: 'Duplicate' })).toHaveAttribute(
        'href',
        '/app/acme/sweepstakes/new'
      );
    });

    it.each([
      ['showAction is off', { showAction: false }],
      ['there is no action link', { actionHref: undefined }],
      ['there is no action text', { actionText: undefined }]
    ])('hides the action when %s', (_, change) => {
      renderWithLayout(<DemoBanner />, { banner: { ...banner, ...change } });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('takes precedence over the demo banner', () => {
      renderWithLayout(<DemoBanner />, { banner, action: 'demo' });
      expect(screen.queryByText('Demo Mode')).not.toBeInTheDocument();
      expect(screen.getByText('Read only')).toBeInTheDocument();
    });

    it('matches the snapshot', () => {
      const { container } = renderWithLayout(<DemoBanner />, { banner });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('in demo mode', () => {
    it('explains that the editor is in evaluation mode', () => {
      renderWithLayout(<DemoBanner />, { action: 'demo', type: 'picker' });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Demo Mode');
      expect(alert).toHaveTextContent(
        "- You're exploring picker the editor in evaluation mode."
      );
      expect(alert).toHaveTextContent('- Sign up to save!');
    });

    it('invites the visitor to create an account', () => {
      renderWithLayout(<DemoBanner />, { action: 'demo' });
      expect(
        screen.getByRole('link', { name: /Create Free Account/ })
      ).toHaveAttribute('href', '/login');
    });

    it('matches the snapshot', () => {
      const { container } = renderWithLayout(<DemoBanner />, {
        action: 'demo'
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  it.each(['create', 'edit', 'view'] as const)(
    'renders nothing for the %s action without a banner',
    (action) => {
      const { container } = renderWithLayout(<DemoBanner />, { action });
      expect(container).toBeEmptyDOMElement();
    }
  );
});
