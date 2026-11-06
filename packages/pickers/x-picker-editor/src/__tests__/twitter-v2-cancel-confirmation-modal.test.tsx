import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { TwitterV2CancelConfirmationModal } from '../twitter-v2-cancel-confirmation-modal';

const renderModal = (action: UnifiedFormAction) =>
  render(
    <TwitterV2CancelConfirmationModal
      action={action}
      open
      isLoading={false}
      onClose={vi.fn()}
      onDiscard={vi.fn()}
      onSave={vi.fn()}
    />
  );

describe('TwitterV2CancelConfirmationModal', () => {
  describe('when in the demo', () => {
    it('links to the pricing section and the sign up page', () => {
      renderModal('demo');
      const links = within(screen.getByRole('dialog')).getAllByRole('link');
      expect(
        links.map((link) => [link.textContent, link.getAttribute('href')])
      ).toEqual([
        ['Exit Demo', '/#pricing'],
        ['Sign Up', '/login']
      ]);
    });

    it('renders the demo actions as links without nested buttons', () => {
      renderModal('demo');
      expect(
        screen.queryByRole('button', { name: /Exit Demo|Sign Up/ })
      ).not.toBeInTheDocument();
      screen
        .getAllByRole('link')
        .forEach((link) => expect(link.querySelector('button')).toBeNull());
    });
  });

  it('shows no demo links outside the demo', () => {
    renderModal('edit');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
