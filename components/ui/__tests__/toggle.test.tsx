import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle, toggleVariants } from '../toggle';

describe('Toggle', () => {
  it('toggles its pressed state when clicked', async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="Bold" onPressedChange={onPressedChange}>
        B
      </Toggle>
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('follows the controlled pressed prop', async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="Bold" pressed onPressedChange={onPressedChange}>
        B
      </Toggle>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onPressedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('cannot be toggled when disabled', async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="Bold" disabled onPressedChange={onPressedChange}>
        B
      </Toggle>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it.each([
    ['default', 'h-10'],
    ['sm', 'h-9'],
    ['lg', 'h-11']
  ] as const)('applies the %s size', (size, className) => {
    render(
      <Toggle aria-label="Bold" size={size}>
        B
      </Toggle>
    );
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveClass(className);
  });

  it('adds a border for the outline variant and merges a custom class name', () => {
    render(
      <Toggle aria-label="Bold" variant="outline" className="rounded-full">
        B
      </Toggle>
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveClass('border', 'border-input', 'rounded-full');
    expect(toggle).not.toHaveClass('rounded-md');
  });
});

describe('toggleVariants', () => {
  it('uses the default variant and size when none are given', () => {
    const classes = toggleVariants();
    expect(classes).toContain('bg-transparent');
    expect(classes).toContain('h-10');
    expect(classes).not.toContain('border-input');
  });
});
