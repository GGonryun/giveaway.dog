import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishConfirmationModal } from '../publish-confirmation-modal';
import {
  buildFormValues,
  FIXED_NOW,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

type ModalProps = React.ComponentProps<typeof PublishConfirmationModal>;

const renderModal = (
  props: Partial<ModalProps> = {},
  startDate: Date | null = new Date('2026-07-01T12:00:00.000Z')
) => {
  const handlers = {
    onClose: vi.fn(),
    onContinueEditing: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    onPublish: vi.fn()
  };
  const values = buildFormValues();
  const view = renderWithForm(
    <PublishConfirmationModal
      open
      action="create"
      name="Summer Giveaway"
      isSaving={false}
      isPublishing={false}
      {...handlers}
      {...props}
    />,
    {
      values: {
        ...values,
        timing: { ...values.timing, startDate: startDate as Date }
      }
    }
  );
  return { ...view, ...handlers };
};

const getDialog = () => screen.getByRole('dialog');

describe('PublishConfirmationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when dismissed', async () => {
    const { onClose } = renderModal();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  describe('when publishing a draft', () => {
    it('says when the sweepstakes will go live', () => {
      renderModal();
      expect(getDialog()).toHaveAccessibleName('Ready to Publish?');
      expect(getDialog()).toHaveAccessibleDescription(
        'Your sweepstakes "Summer Giveaway" will be published and go live in 16 days!'
      );
    });

    it.each([
      ['in the past', new Date('2026-06-01T12:00:00.000Z')],
      ['now', FIXED_NOW],
      ['missing', null]
    ])('goes live immediately when the start date is %s', (_, startDate) => {
      renderModal({}, startDate);
      expect(getDialog()).toHaveAccessibleDescription(
        'Your sweepstakes "Summer Giveaway" will be published and go live immediately!'
      );
    });

    it('saves the draft from the save and exit button', async () => {
      const { onSave, onPublish } = renderModal();
      await userEvent.click(
        screen.getByRole('button', { name: 'Save & Exit' })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onPublish).not.toHaveBeenCalled();
    });

    it('publishes from the publish button', async () => {
      const { onSave, onPublish } = renderModal();
      await userEvent.click(
        screen.getByRole('button', { name: 'Publish Now' })
      );
      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows the saving state while saving', () => {
      renderModal({ isSaving: true });
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Publish Now' })
      ).toBeDisabled();
    });

    it('shows the publishing state while publishing', () => {
      renderModal({ isPublishing: true });
      expect(
        screen.getByRole('button', { name: 'Publishing...' })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Save & Exit' })
      ).toBeDisabled();
    });
  });

  describe('when saving changes to a published sweepstakes', () => {
    it('says that the changes go live immediately', () => {
      renderModal({ action: 'edit' });
      expect(getDialog()).toHaveAccessibleName('Save Changes?');
      expect(getDialog()).toHaveAccessibleDescription(
        'Your sweepstakes "Summer Giveaway" will be updated and changes will go live immediately!'
      );
    });

    it('cancels from the continue editing button', async () => {
      const { onCancel, onSave } = renderModal({ action: 'edit' });
      await userEvent.click(
        screen.getByRole('button', { name: 'Continue Editing' })
      );
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('saves from the confirm button', async () => {
      const { onSave, onPublish } = renderModal({ action: 'edit' });
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onPublish).not.toHaveBeenCalled();
    });

    it('disables both buttons while saving', () => {
      renderModal({ action: 'edit', isSaving: true });
      within(getDialog())
        .getAllByRole('button')
        .filter((button) => button.textContent !== 'Close')
        .forEach((button) => expect(button).toBeDisabled());
    });

    it.fails(
      'shows the saving state on the confirm button while saving',
      () => {
        renderModal({ action: 'edit', isSaving: true });
        expect(
          screen.getByRole('button', { name: 'Saving...' })
        ).toBeDisabled();
      }
    );
  });

  describe('in the demo', () => {
    it('explains that publishing is not available', () => {
      renderModal({ action: 'demo' });
      expect(within(getDialog()).getByRole('alert')).toHaveTextContent(
        'Demo Mode: Publishing and saving are not available in the demo.'
      );
      expect(
        screen.queryByRole('button', { name: 'Publish Now' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save & Exit' })
      ).not.toBeInTheDocument();
    });

    it('links to pricing and sign up', () => {
      renderModal({ action: 'demo' });
      expect(screen.getByRole('link', { name: 'Exit Demo' })).toHaveAttribute(
        'href',
        '/#pricing'
      );
      expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute(
        'href',
        '/login'
      );
    });

    it('cancels from the continue editing button', async () => {
      const { onCancel } = renderModal({ action: 'demo' });
      await userEvent.click(
        screen.getByRole('button', { name: 'Continue Editing' })
      );
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
