import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
import { withStableIds } from '@giveaway/testing-dom/test-utils';

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
  it('matches the snapshot when open', async () => {
    renderAlertDialog();
    const dialog = await openDialog();
    expect(withStableIds(dialog)).toMatchSnapshot();
  });
});
