import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../alert-dialog';

function renderAlertDialog(
  props: {
    onAction?: () => void;
    onOpenChange?: (open: boolean) => void;
  } = {}
) {
  return render(
    <AlertDialog onOpenChange={props.onOpenChange}>
      <AlertDialogTrigger>Delete giveaway</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this giveaway?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={props.onAction}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

async function openDialog() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Delete giveaway' })
  );
  return screen.getByRole('alertdialog');
}

describe('AlertDialog', () => {
  it('stays closed until the trigger is clicked', async () => {
    renderAlertDialog();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    const dialog = await openDialog();

    expect(dialog).toHaveAccessibleName('Delete this giveaway?');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  });

  it('styles the action as a primary button and cancel as an outline button', async () => {
    renderAlertDialog();
    await openDialog();
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-primary'
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'border',
      'bg-white'
    );
  });

  it('closes and reports the change when cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const onAction = vi.fn();
    renderAlertDialog({ onOpenChange, onAction });
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('runs the action and closes when the action is clicked', async () => {
    const onAction = vi.fn();
    renderAlertDialog({ onAction });
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    renderAlertDialog();
    await openDialog();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders an overlay and the header and footer slots', async () => {
    renderAlertDialog();
    await openDialog();
    expect(
      document.querySelector('[data-slot="alert-dialog-overlay"]')
    ).toHaveClass('fixed', 'inset-0', 'bg-black/50');
    expect(
      document.querySelector('[data-slot="alert-dialog-header"]')
    ).toContainElement(screen.getByText('Delete this giveaway?'));
    expect(
      document.querySelector('[data-slot="alert-dialog-footer"]')
    ).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  });
});
