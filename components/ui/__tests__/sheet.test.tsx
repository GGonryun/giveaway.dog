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
import { withStableIds } from './test-utils';

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

  it('opens from the trigger with its title and description', async () => {
    renderSheet();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const sheet = await openSheet();
    expect(sheet).toHaveAccessibleDescription('Narrow down the entries.');
  });

  it.each([
    [undefined, ['right-0', 'border-l', 'h-full']],
    ['right', ['right-0', 'border-l', 'h-full']],
    ['left', ['left-0', 'border-r', 'h-full']],
    ['top', ['top-0', 'border-b', 'h-auto']],
    ['bottom', ['bottom-0', 'border-t', 'h-auto']]
  ] as const)('slides in from the %s side', async (side, classNames) => {
    renderSheet(side);
    const sheet = await openSheet();
    expect(sheet).toHaveClass(...classNames);
  });

  it('closes from the built-in close button', async () => {
    renderSheet();
    await openSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes from a SheetClose element', async () => {
    renderSheet();
    await openSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the overlay and the header and footer slots', async () => {
    renderSheet();
    await openSheet();
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toHaveClass(
      'bg-black/50'
    );
    expect(document.querySelector('[data-slot="sheet-header"]')).toHaveClass(
      'flex-col',
      'p-4'
    );
    expect(document.querySelector('[data-slot="sheet-footer"]')).toHaveClass(
      'mt-auto'
    );
  });
});
