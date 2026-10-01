import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('toggles when clicked and reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute('data-state', 'checked');

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('shows the check indicator only when checked', async () => {
    render(<Checkbox aria-label="Accept terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.querySelector('svg')).not.toBeInTheDocument();

    await userEvent.click(checkbox);

    const indicator = checkbox.querySelector(
      '[data-slot="checkbox-indicator"]'
    );
    expect(indicator?.querySelector('svg')).toBeInTheDocument();
  });

  it('follows the controlled checked prop', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Accept terms"
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).not.toBeChecked();
  });

  it('exposes the indeterminate state as mixed', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();
  });

  it('cannot be toggled when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Accept terms"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('toggles when its label is clicked', async () => {
    render(
      <>
        <Checkbox id="terms" />
        <label htmlFor="terms">Accept terms</label>
      </>
    );
    await userEvent.click(screen.getByText('Accept terms'));
    expect(
      screen.getByRole('checkbox', { name: 'Accept terms' })
    ).toBeChecked();
  });

  it('merges a custom class name', () => {
    render(<Checkbox aria-label="Accept terms" className="size-5" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('size-5', 'rounded-[4px]');
    expect(checkbox).not.toHaveClass('size-4');
  });
});
