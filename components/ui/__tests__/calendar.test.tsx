import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDay, type Modifiers } from 'react-day-picker';
import { describe, expect, it, vi } from 'vitest';
import { Calendar, CalendarDayButton } from '../calendar';

const january2024 = new Date(2024, 0, 1);

function getDay(label: RegExp) {
  return screen.getByLabelText(label);
}

describe('Calendar', () => {
  it('renders the month grid labelled with the month', () => {
    render(<Calendar mode="single" defaultMonth={january2024} />);
    expect(
      screen.getByRole('grid', { name: 'January 2024' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('January 2024');
  });

  it('shows days from the adjacent months by default', () => {
    render(<Calendar mode="single" defaultMonth={january2024} />);
    expect(getDay(/December 31st, 2023/)).toBeInTheDocument();
  });

  it('hides days from the adjacent months when asked to', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        showOutsideDays={false}
      />
    );
    expect(
      screen.queryByLabelText(/December 31st, 2023/)
    ).not.toBeInTheDocument();
  });

  it('reports the day picked in single mode', async () => {
    const onSelect = vi.fn();
    render(
      <Calendar mode="single" defaultMonth={january2024} onSelect={onSelect} />
    );
    await userEvent.click(getDay(/January 10th, 2024/));
    expect(onSelect.mock.calls[0][0]).toEqual(new Date(2024, 0, 10));
  });

  it('marks a single selected day', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        selected={new Date(2024, 0, 10)}
      />
    );
    const day = getDay(/January 10th, 2024/);
    expect(day).toHaveAttribute('data-selected-single', 'true');
    expect(getDay(/January 11th, 2024/)).not.toHaveAttribute(
      'data-selected-single'
    );
  });

  it('marks the start, middle and end of a selected range', () => {
    render(
      <Calendar
        mode="range"
        defaultMonth={january2024}
        selected={{ from: new Date(2024, 0, 10), to: new Date(2024, 0, 12) }}
      />
    );
    const start = getDay(/January 10th, 2024/);
    expect(start).toHaveAttribute('data-range-start', 'true');
    expect(start).toHaveAttribute('data-selected-single', 'false');
    expect(getDay(/January 11th, 2024/)).toHaveAttribute(
      'data-range-middle',
      'true'
    );
    expect(getDay(/January 12th, 2024/)).toHaveAttribute(
      'data-range-end',
      'true'
    );
  });

  it('moves between months with the navigation buttons', async () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        onMonthChange={onMonthChange}
      />
    );

    await userEvent.click(screen.getByLabelText('Go to the Next Month'));
    expect(
      screen.getByRole('grid', { name: 'February 2024' })
    ).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2024, 1, 1));

    await userEvent.click(screen.getByLabelText('Go to the Previous Month'));
    expect(
      screen.getByRole('grid', { name: 'January 2024' })
    ).toBeInTheDocument();
  });

  it('renders month and year dropdowns with short month names', async () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        captionLayout="dropdown"
        startMonth={new Date(2023, 0)}
        endMonth={new Date(2025, 11)}
      />
    );
    const month = screen.getByRole('combobox', { name: 'Choose the Month' });
    expect(month).toHaveDisplayValue('Jan');
    expect(
      screen.getByRole('combobox', { name: 'Choose the Year' })
    ).toHaveDisplayValue('2024');

    await userEvent.selectOptions(month, 'Mar');

    expect(
      screen.getByRole('grid', { name: 'March 2024' })
    ).toBeInTheDocument();
  });

  it('uses ghost navigation buttons unless another variant is given', () => {
    const { unmount } = render(
      <Calendar mode="single" defaultMonth={january2024} />
    );
    expect(screen.getByLabelText('Go to the Next Month')).not.toHaveClass(
      'border'
    );
    unmount();

    render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        buttonVariant="outline"
      />
    );
    expect(screen.getByLabelText('Go to the Next Month')).toHaveClass('border');
  });

  it('marks the root with the calendar slot and merges a custom class name', () => {
    const { container } = render(
      <Calendar
        mode="single"
        defaultMonth={january2024}
        className="rounded-md"
      />
    );
    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass(
      'rdp-root',
      'rounded-md',
      'p-3'
    );
  });
});

describe('CalendarDayButton', () => {
  const day = new CalendarDay(new Date(2024, 0, 10), january2024);

  function renderDayButton(modifiers: Modifiers) {
    render(
      <CalendarDayButton day={day} modifiers={modifiers}>
        10
      </CalendarDayButton>
    );
    return screen.getByRole('button', { name: '10' });
  }

  it('focuses itself when its day is focused', () => {
    expect(renderDayButton({ focused: true })).toHaveFocus();
  });

  it('does not take focus otherwise', () => {
    expect(renderDayButton({ focused: false })).not.toHaveFocus();
  });

  it('records the day as a locale date string', () => {
    expect(renderDayButton({})).toHaveAttribute(
      'data-day',
      new Date(2024, 0, 10).toLocaleDateString()
    );
  });

  it.each<[Modifiers, Record<string, string | null>]>([
    [
      { selected: true },
      { 'data-selected-single': 'true', 'data-range-start': null }
    ],
    [
      { selected: true, range_start: true },
      { 'data-selected-single': 'false', 'data-range-start': 'true' }
    ],
    [
      { selected: true, range_middle: true },
      { 'data-selected-single': 'false', 'data-range-middle': 'true' }
    ],
    [
      { selected: true, range_end: true },
      { 'data-selected-single': 'false', 'data-range-end': 'true' }
    ],
    [{ selected: false }, { 'data-selected-single': 'false' }]
  ])('derives the data attributes from %o', (modifiers, attributes) => {
    const button = renderDayButton(modifiers);
    Object.entries(attributes).forEach(([name, value]) => {
      expect(button.getAttribute(name)).toBe(value);
    });
  });
});
