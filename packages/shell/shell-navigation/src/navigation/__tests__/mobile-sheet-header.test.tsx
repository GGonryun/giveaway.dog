import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sheet, SheetContent } from '@giveaway/ui-primitives/sheet';
import { MobileSheetHeader } from '../mobile-sheet-header';

const renderInOpenSheet = (onLogoClick = vi.fn()) => {
  render(
    <Sheet open>
      <SheetContent aria-describedby={undefined}>
        <MobileSheetHeader onLogoClick={onLogoClick} />
      </SheetContent>
    </Sheet>
  );
  return { onLogoClick };
};

describe('MobileSheetHeader', () => {
  it('gives the sheet an accessible title', () => {
    renderInOpenSheet();
    expect(
      screen.getByRole('dialog', { name: /Giveaway\.dog/ })
    ).toBeInTheDocument();
  });

  it('keeps the logo link out of view', () => {
    renderInOpenSheet();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { hidden: true })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('calls onLogoClick when the logo link is activated', () => {
    const { onLogoClick } = renderInOpenSheet();
    const link = screen.getByRole('link', { hidden: true });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });
});
