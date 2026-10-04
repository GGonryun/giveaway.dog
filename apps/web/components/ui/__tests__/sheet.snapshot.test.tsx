import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../sheet';
import { withStableIds } from '@giveaway/testing-dom/test-utils';

function renderSheet(side?: 'top' | 'right' | 'bottom' | 'left') {
  return render(
    <Sheet>
      <SheetTrigger>Open filters</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the entries.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Apply</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

async function openSheet() {
  await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));
  return screen.getByRole('dialog', { name: 'Filters' });
}

describe('Sheet', () => {
  it('matches the snapshot when open', async () => {
    renderSheet();
    const sheet = await openSheet();
    expect(withStableIds(sheet)).toMatchSnapshot();
  });
});
