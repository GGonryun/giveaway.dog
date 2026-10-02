import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Button } from '../button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../dialog';

describe.each(THEMES)('Dialog (%s)', (theme) => {
  test('open', async () => {
    await renderVisual(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this giveaway?</DialogTitle>
            <DialogDescription>
              The entries and the winners are deleted too. You cannot undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
      { theme }
    );
    await expect.element(page.getByRole('dialog')).toMatchScreenshot();
  });
});
