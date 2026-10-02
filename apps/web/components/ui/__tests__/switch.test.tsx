import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from '../switch';

describe('Switch', () => {
  it('toggles when clicked and reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />
    );
    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAttribute('data-state', 'checked');

    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('moves the thumb with the checked state', async () => {
    render(<Switch aria-label="Notifications" />);
    const toggle = screen.getByRole('switch');
    const thumb = toggle.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toHaveAttribute('data-state', 'unchecked');

    await userEvent.click(toggle);

    expect(thumb).toHaveAttribute('data-state', 'checked');
  });

  it('toggles with the keyboard', async () => {
    render(<Switch aria-label="Notifications" />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('follows the controlled checked prop', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Notifications"
        checked
        onCheckedChange={onCheckedChange}
      />
    );
    await userEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('cannot be toggled when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Notifications"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
    await userEvent.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('merges a custom class name', () => {
    render(<Switch aria-label="Notifications" className="w-10" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('w-10', 'rounded-full');
    expect(toggle).not.toHaveClass('w-8');
  });
});
