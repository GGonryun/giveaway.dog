import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
import { withStableIds } from '@giveaway/testing-dom/test-utils';

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
});
