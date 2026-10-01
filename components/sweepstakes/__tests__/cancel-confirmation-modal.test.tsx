import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedFormAction } from '@/components/patterns/form-layout/types';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import type { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { CancelConfirmationModal } from '../cancel-confirmation-modal';

const EditorForm = ({
  name,
  children
}: {
  name: string;
  children: ReactNode;
}) => {
  const form = useForm<GiveawayFormSchema>({
    defaultValues: { setup: { name, description: '', banner: '' } }
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderModal = ({
  action = 'create',
  name = 'Summer Giveaway',
  open = true,
  isLoading = false
}: {
  action?: UnifiedFormAction;
  name?: string;
  open?: boolean;
  isLoading?: boolean;
} = {}) => {
  const handlers = { onClose: vi.fn(), onDiscard: vi.fn(), onSave: vi.fn() };
  render(
    <EditorForm name={name}>
      <CancelConfirmationModal
        action={action}
        open={open}
        isLoading={isLoading}
        {...handlers}
      />
    </EditorForm>
  );
  return handlers;
};

describe('CancelConfirmationModal', () => {
  it('renders nothing while closed', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the sweepstakes with unsaved changes', () => {
    renderModal({ name: 'Winter Raffle' });
    const dialog = screen.getByRole('dialog', {
      name: "You're exiting the Sweepstakes Editor"
    });
    expect(dialog).toHaveAccessibleDescription(
      'You have unsaved changes to "Winter Raffle". What would you like to do?'
    );
  });

  it('falls back to the default name when the name is empty', () => {
    renderModal({ name: '' });
    expect(screen.getByRole('dialog')).toHaveTextContent(
      `You have unsaved changes to "${DEFAULT_SWEEPSTAKES_NAME}".`
    );
  });

  it('continues editing when asked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Continue Editing' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when escape is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  describe('when creating', () => {
    it('offers to delete the draft or save and exit', async () => {
      const user = userEvent.setup();
      const { onDiscard, onSave } = renderModal({ action: 'create' });

      await user.click(screen.getByRole('button', { name: 'Delete Draft' }));
      await user.click(screen.getByRole('button', { name: 'Save & Exit' }));

      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('when editing', () => {
    it('offers to discard the changes but not to save', async () => {
      const user = userEvent.setup();
      const { onDiscard } = renderModal({ action: 'edit' });

      await user.click(screen.getByRole('button', { name: 'Discard Changes' }));

      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('button', { name: 'Save & Exit' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when viewing', () => {
    it('offers to delete the draft without saving', () => {
      renderModal({ action: 'view' });
      expect(
        screen.getByRole('button', { name: 'Delete Draft' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save & Exit' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when in the demo', () => {
    it('explains that saving and deleting are disabled', () => {
      renderModal({ action: 'demo' });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Demo Mode: Saving and deleting are not available in the demo.'
      );
      expect(
        screen.queryByRole('button', { name: /Delete Draft|Discard Changes/ })
      ).not.toBeInTheDocument();
    });

    it('links to the pricing section and the sign up page', () => {
      renderModal({ action: 'demo' });
      const dialog = screen.getByRole('dialog');
      const links = within(dialog).getAllByRole('link');
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/#pricing',
        '/login'
      ]);
      expect(links[0]).toHaveTextContent('Exit Demo');
      expect(links[1]).toHaveTextContent('Sign Up');
    });
  });

  it('disables every action while loading', () => {
    renderModal({ action: 'create', isLoading: true });
    expect(
      screen.getByRole('button', { name: 'Continue Editing' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Draft' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save & Exit' })).toBeDisabled();
  });
});
