import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DateRange } from 'react-day-picker';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePickerWithRange } from '../date-picker-with-range';

const from = new Date(2024, 0, 10);
const to = new Date(2024, 0, 20);

function renderPicker(date: DateRange | undefined, className?: string) {
  const onDateChange = vi.fn();
  const result = render(
    <DatePickerWithRange
      date={date}
      onDateChange={onDateChange}
      className={className}
    />
  );
  return { ...result, onDateChange };
}

function getTrigger() {
  return screen.getByRole('button', { expanded: false });
}

describe('DatePickerWithRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('prompts for a range when no date is set', () => {
    renderPicker(undefined);
    const trigger = screen.getByRole('button', { name: 'Pick a date range' });
    expect(trigger).toHaveClass('text-muted-foreground');
  });

  it('shows the start date when only the start is set', () => {
    renderPicker({ from, to: undefined });
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent(from.toLocaleDateString());
    expect(trigger).not.toHaveTextContent(' - ');
    expect(trigger).not.toHaveClass('text-muted-foreground');
  });

  it('shows both dates when the range is complete', () => {
    renderPicker({ from, to });
    expect(getTrigger()).toHaveTextContent(
      `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`
    );
  });

  it('opens a two month calendar starting at the selected month', async () => {
    renderPicker({ from, to });
    await userEvent.click(getTrigger());
    expect(
      screen.getAllByRole('grid').map((grid) => grid.getAttribute('aria-label'))
    ).toEqual(['January 2024', 'February 2024']);
    expect(screen.getByLabelText(/January 10th, 2024/)).toHaveAttribute(
      'data-range-start',
      'true'
    );
  });

  it('opens on the current month and reports the first pick as a one day range', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 0, 5));
    const { onDateChange } = renderPicker(undefined);
    await userEvent.click(getTrigger());
    expect(
      screen.getAllByRole('grid').map((grid) => grid.getAttribute('aria-label'))
    ).toEqual(['January 2024', 'February 2024']);

    await userEvent.click(screen.getByLabelText(/January 15th, 2024/));

    expect(onDateChange.mock.calls[0][0]).toEqual({
      from: new Date(2024, 0, 15),
      to: new Date(2024, 0, 15)
    });
  });

  it('extends the range when a later day is picked', async () => {
    const { onDateChange } = renderPicker({ from, to: undefined });
    await userEvent.click(getTrigger());
    await userEvent.click(screen.getByLabelText(/January 15th, 2024/));
    expect(onDateChange).toHaveBeenCalledWith(
      { from, to: new Date(2024, 0, 15) },
      new Date(2024, 0, 15),
      expect.anything(),
      expect.anything()
    );
  });

  it('applies the class name to both the wrapper and the trigger', () => {
    const { container } = renderPicker(undefined, 'w-full');
    expect(container.firstChild).toHaveClass('grid', 'w-full');
    expect(
      screen.getByRole('button', { name: 'Pick a date range' })
    ).toHaveClass('w-full');
  });
});
