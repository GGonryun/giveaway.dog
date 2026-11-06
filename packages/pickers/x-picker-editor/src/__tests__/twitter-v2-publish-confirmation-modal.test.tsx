import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { TwitterV2PublishConfirmationModal } from '../twitter-v2-publish-confirmation-modal';

const renderModal = (action: UnifiedFormAction) =>
  render(
    <TwitterV2PublishConfirmationModal
      action={action}
      open
      isUpdating={false}
      isPublishing={false}
      isScheduled={false}
      onClose={vi.fn()}
      onCancel={vi.fn()}
      onSave={vi.fn()}
      onPublish={vi.fn()}
    />
  );

describe('TwitterV2PublishConfirmationModal', () => {
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
    renderModal('create');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
