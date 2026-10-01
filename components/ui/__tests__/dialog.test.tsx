import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../dialog';
import { withStableIds } from './test-utils';

function renderDialog(
  props: {
    showCloseButton?: boolean;
    onOpenChange?: (open: boolean) => void;
  } = {}
) {
  return render(
    <Dialog onOpenChange={props.onOpenChange}>
      <DialogTrigger>Edit profile</DialogTrigger>
      <DialogContent showCloseButton={props.showCloseButton}>
        <DialogHeader>
          <DialogTitle>Profile settings</DialogTitle>
          <DialogDescription>Update your public profile.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  return screen.getByRole('dialog');
}

describe('Dialog', () => {
  it('matches the snapshot when open', async () => {
    renderDialog();
    const dialog = await openDialog();
    expect(withStableIds(dialog)).toMatchSnapshot();
  });

  it('opens from the trigger and is described by its title and description', async () => {
    renderDialog();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const dialog = await openDialog();

    expect(dialog).toHaveAccessibleName('Profile settings');
    expect(dialog).toHaveAccessibleDescription('Update your public profile.');
    expect(dialog).toHaveAttribute('data-slot', 'dialog-content');
  });

  it('closes from the built-in close button', async () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('hides the built-in close button when showCloseButton is false', async () => {
    renderDialog({ showCloseButton: false });
    await openDialog();
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument();
  });

  it('closes from a DialogClose element', async () => {
    renderDialog({ showCloseButton: false });
    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    renderDialog();
    await openDialog();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an overlay behind the content', async () => {
    renderDialog();
    await openDialog();
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'fixed',
      'inset-0',
      'bg-black/50'
    );
  });

  it('can be opened through the controlled open prop', () => {
    render(
      <Dialog open>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Controlled</DialogTitle>
          <DialogDescription>Opened by its parent.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'Controlled' });
    expect(dialog).toHaveClass('sm:max-w-xl', 'rounded-lg');
    expect(dialog).not.toHaveClass('sm:max-w-lg');
  });
});
