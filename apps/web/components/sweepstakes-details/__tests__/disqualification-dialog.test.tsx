import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisqualificationDialog } from '../disqualification-dialog';

const renderDialog = (
  props: Partial<ComponentProps<typeof DisqualificationDialog>> = {}
) => {
  const onOpenChange = vi.fn();
  render(
    <DisqualificationDialog
      open
      onOpenChange={onOpenChange}
      participantName="Chad Cheater"
      disqualificationReason="Used multiple accounts"
      {...props}
    />
  );
  return { onOpenChange };
};

describe('DisqualificationDialog', () => {
  it('renders nothing while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the participant and the reason', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', {
      name: 'Disqualification Details'
    });
    expect(dialog).toHaveAccessibleDescription(
      'This participant was disqualified from winning this prize.'
    );
    expect(dialog).toHaveTextContent('Chad Cheater');
    expect(dialog).toHaveTextContent('Used multiple accounts');
  });

  it('falls back to a placeholder without a reason', () => {
    renderDialog({ disqualificationReason: null });
    expect(screen.getByText('No reason provided')).toBeInTheDocument();
  });

  it('shows the draw date when given', () => {
    const drawDate = new Date(2026, 9, 9, 10, 0);
    renderDialog({ drawDate });
    expect(screen.getByText('Draw Date')).toBeInTheDocument();
    expect(screen.getByText(drawDate.toLocaleString())).toBeInTheDocument();
  });

  it('hides the draw date without one', () => {
    renderDialog({ drawDate: null });
    expect(screen.queryByText('Draw Date')).not.toBeInTheDocument();
  });

  it('does not show the participant email even when given', () => {
    renderDialog({ participantEmail: 'chad@example.com' });
    expect(screen.queryByText(/chad@example.com/)).not.toBeInTheDocument();
  });

  it('closes from the footer button', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    const footerClose = screen
      .getAllByRole('button', { name: 'Close' })
      .find((button) => button.getAttribute('data-slot') === 'button');
    await user.click(footerClose as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
