import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from '../slider';

function focusThumb() {
  const thumb = screen.getByRole('slider');
  act(() => {
    thumb.focus();
  });
  return thumb;
}

describe('Slider', () => {
  it('exposes the thumb as a slider with its value and bounds', () => {
    render(<Slider defaultValue={[25]} min={0} max={50} />);
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('aria-valuenow', '25');
    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '50');
  });

  it('changes the value by one step with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(
      <Slider defaultValue={[25]} step={5} onValueChange={onValueChange} />
    );
    const thumb = focusThumb();

    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '30');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(thumb).toHaveAttribute('aria-valuenow', '20');
    expect(onValueChange.mock.calls).toEqual([[[30]], [[25]], [[20]]]);
  });

  it('jumps to the bounds with Home and End', async () => {
    render(<Slider defaultValue={[25]} />);
    const thumb = focusThumb();

    await userEvent.keyboard('{End}');
    expect(thumb).toHaveAttribute('aria-valuenow', '100');

    await userEvent.keyboard('{Home}');
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  it('fills the range up to the current value', () => {
    const { container } = render(<Slider defaultValue={[25]} />);
    const range = container.querySelector('.bg-primary') as HTMLElement;
    expect(range.style.left).toBe('0%');
    expect(range.style.right).toBe('75%');
  });

  it('ignores the keyboard when disabled', async () => {
    const onValueChange = vi.fn();
    render(
      <Slider defaultValue={[25]} disabled onValueChange={onValueChange} />
    );
    const thumb = focusThumb();
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '25');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('merges a custom class name on the root', () => {
    const { container } = render(
      <Slider defaultValue={[25]} className="w-60" />
    );
    expect(container.firstChild).toHaveClass('w-60', 'touch-none');
  });
});
