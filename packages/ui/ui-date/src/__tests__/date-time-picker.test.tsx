import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DateTimePicker,
  TimePicker,
  TimePickerInput,
  type TimePickerType
} from '../date-time-picker';

const afternoon = new Date(2024, 0, 15, 14, 5, 9);
const midnight = new Date(2024, 0, 15, 0, 0, 0);

type StatefulInputProps = Omit<
  React.ComponentProps<typeof TimePickerInput>,
  'date' | 'onDateChange'
> & {
  initialDate: Date;
  onDateChange?: (date: Date | undefined) => void;
};

function StatefulTimePickerInput({
  initialDate,
  onDateChange,
  ...props
}: StatefulInputProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  return (
    <TimePickerInput
      aria-label="Time"
      {...props}
      date={date}
      onDateChange={(next) => {
        setDate(next);
        onDateChange?.(next);
      }}
    />
  );
}

type StatefulPickerProps = Omit<
  React.ComponentProps<typeof TimePicker>,
  'date' | 'onChange'
> & {
  initialDate: Date;
  onChange?: (date: Date | undefined) => void;
};

function StatefulTimePicker({
  initialDate,
  onChange,
  ...props
}: StatefulPickerProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  return (
    <TimePicker
      {...props}
      date={date}
      onChange={(next) => {
        setDate(next);
        onChange?.(next);
      }}
    />
  );
}

function getTimeInput() {
  return screen.getByRole('textbox', { name: 'Time' });
}

function getTimeValues() {
  return screen
    .getAllByRole('textbox')
    .map((input) => (input as HTMLInputElement).value);
}

function pressKeys(element: HTMLElement, ...keys: string[]) {
  keys.forEach((key) => {
    fireEvent.keyDown(element, { key });
  });
}

function lastDate(mock: ReturnType<typeof vi.fn>) {
  return mock.mock.lastCall?.[0] as Date;
}

describe('TimePickerInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each<[TimePickerType, string]>([
    ['hours', '14'],
    ['minutes', '05'],
    ['seconds', '09'],
    ['12hours', '02']
  ])('shows the %s of the date as %s', (picker, value) => {
    render(
      <TimePickerInput aria-label="Time" picker={picker} date={afternoon} />
    );
    expect(getTimeInput()).toHaveValue(value);
  });

  it('shows 00 when the date is null', () => {
    render(<TimePickerInput aria-label="Time" picker="hours" date={null} />);
    expect(getTimeInput()).toHaveValue('00');
  });

  it('starts at midnight when no date is given', () => {
    render(<TimePickerInput aria-label="Time" picker="12hours" />);
    expect(getTimeInput()).toHaveValue('12');
  });

  it('uses the picker as the default id and name', () => {
    render(<TimePickerInput aria-label="Time" picker="minutes" />);
    expect(getTimeInput()).toHaveAttribute('id', 'minutes');
    expect(getTimeInput()).toHaveAttribute('name', 'minutes');
    expect(getTimeInput()).toHaveAttribute('type', 'tel');
    expect(getTimeInput()).toHaveAttribute('inputmode', 'decimal');
  });

  it('prefers an explicit value over the date', () => {
    render(
      <TimePickerInput
        aria-label="Time"
        picker="hours"
        date={afternoon}
        value="07"
        onChange={vi.fn()}
      />
    );
    expect(getTimeInput()).toHaveValue('07');
  });

  it('steps the hours with the arrow keys and wraps around', () => {
    const onDateChange = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="hours"
        initialDate={new Date(2024, 0, 15, 23, 30)}
        onDateChange={onDateChange}
      />
    );

    pressKeys(getTimeInput(), 'ArrowUp');
    expect(getTimeInput()).toHaveValue('00');
    expect(lastDate(onDateChange)).toEqual(new Date(2024, 0, 15, 0, 30));

    pressKeys(getTimeInput(), 'ArrowDown');
    expect(getTimeInput()).toHaveValue('23');
  });

  it('wraps the minutes below zero', () => {
    render(<StatefulTimePickerInput picker="minutes" initialDate={midnight} />);
    pressKeys(getTimeInput(), 'ArrowDown');
    expect(getTimeInput()).toHaveValue('59');
  });

  it('wraps the 12-hour value between 12 and 01', () => {
    render(
      <StatefulTimePickerInput
        picker="12hours"
        period="PM"
        initialDate={new Date(2024, 0, 15, 12, 0)}
      />
    );
    pressKeys(getTimeInput(), 'ArrowUp');
    expect(getTimeInput()).toHaveValue('01');
    pressKeys(getTimeInput(), 'ArrowDown');
    expect(getTimeInput()).toHaveValue('12');
  });

  it('replaces the value with a typed digit and appends a second one', () => {
    const onRightFocus = vi.fn();
    const onDateChange = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="hours"
        initialDate={midnight}
        onDateChange={onDateChange}
        onRightFocus={onRightFocus}
      />
    );

    pressKeys(getTimeInput(), '1');
    expect(getTimeInput()).toHaveValue('01');
    expect(onRightFocus).not.toHaveBeenCalled();

    pressKeys(getTimeInput(), '5');
    expect(getTimeInput()).toHaveValue('15');
    expect(onRightFocus).toHaveBeenCalledTimes(1);
    expect(lastDate(onDateChange)).toEqual(new Date(2024, 0, 15, 15, 0));
  });

  it('starts over when the second digit comes two seconds later', () => {
    vi.useFakeTimers();
    const onRightFocus = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="hours"
        initialDate={midnight}
        onRightFocus={onRightFocus}
      />
    );

    pressKeys(getTimeInput(), '1');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    pressKeys(getTimeInput(), '5');

    expect(getTimeInput()).toHaveValue('05');
    expect(onRightFocus).not.toHaveBeenCalled();
  });

  it.each<[TimePickerType, string[], string]>([
    ['hours', ['3', '0'], '23'],
    ['minutes', ['7', '5'], '59'],
    ['seconds', ['9', '9'], '59']
  ])('clamps typed %s to the maximum', (picker, keys, value) => {
    render(<StatefulTimePickerInput picker={picker} initialDate={midnight} />);
    pressKeys(getTimeInput(), ...keys);
    expect(getTimeInput()).toHaveValue(value);
  });

  it('enters 12-hour values using the period', () => {
    const onDateChange = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="12hours"
        period="PM"
        initialDate={midnight}
        onDateChange={onDateChange}
      />
    );

    pressKeys(getTimeInput(), '0', '5');

    expect(getTimeInput()).toHaveValue('05');
    expect(lastDate(onDateChange).getHours()).toBe(17);
  });

  it('ignores 12-hour typing when there is no period', () => {
    const onDateChange = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="12hours"
        initialDate={new Date(2024, 0, 15, 9, 0)}
        onDateChange={onDateChange}
      />
    );
    pressKeys(getTimeInput(), '3');
    expect(lastDate(onDateChange).getHours()).toBe(9);
    expect(getTimeInput()).toHaveValue('09');
  });

  it('ignores keys that are not digits', () => {
    const onDateChange = vi.fn();
    render(
      <StatefulTimePickerInput
        picker="hours"
        initialDate={afternoon}
        onDateChange={onDateChange}
      />
    );
    expect(fireEvent.keyDown(getTimeInput(), { key: 'a' })).toBe(false);
    expect(onDateChange).not.toHaveBeenCalled();
    expect(getTimeInput()).toHaveValue('14');
  });

  it('asks to move the focus with the left and right arrows', () => {
    const onLeftFocus = vi.fn();
    const onRightFocus = vi.fn();
    render(
      <TimePickerInput
        aria-label="Time"
        picker="minutes"
        onLeftFocus={onLeftFocus}
        onRightFocus={onRightFocus}
      />
    );
    pressKeys(getTimeInput(), 'ArrowLeft', 'ArrowRight');
    expect(onLeftFocus).toHaveBeenCalledTimes(1);
    expect(onRightFocus).toHaveBeenCalledTimes(1);
  });

  it('lets Tab through and calls the onKeyDown prop', () => {
    const onKeyDown = vi.fn();
    render(
      <TimePickerInput aria-label="Time" picker="hours" onKeyDown={onKeyDown} />
    );
    expect(fireEvent.keyDown(getTimeInput(), { key: 'Tab' })).toBe(true);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});

describe('TimePicker', () => {
  it('renders hour, minute and second inputs by default', () => {
    render(<TimePicker date={afternoon} />);
    expect(getTimeValues()).toEqual(['14', '05', '09']);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it.each([
    ['minute', ['14', '05']],
    ['hour', ['14']],
    ['day', ['14']]
  ] as const)(
    'shows the inputs for the %s granularity',
    (granularity, values) => {
      render(<TimePicker date={afternoon} granularity={granularity} />);
      expect(getTimeValues()).toEqual(values);
    }
  );

  it('shows 12-hour values and the period in the 12-hour cycle', () => {
    render(<TimePicker date={afternoon} hourCycle={12} />);
    expect(getTimeValues()).toEqual(['02', '05', '09']);
    expect(screen.getByRole('combobox')).toHaveTextContent('PM');
  });

  it('moves the focus to the minutes after two hour digits', async () => {
    const onChange = vi.fn();
    render(<StatefulTimePicker initialDate={midnight} onChange={onChange} />);
    const [hours, minutes] = screen.getAllByRole('textbox');

    await userEvent.click(hours);
    await userEvent.keyboard('15');

    expect(minutes).toHaveFocus();
    expect(lastDate(onChange)).toEqual(new Date(2024, 0, 15, 15, 0, 0));
  });

  it('moves the focus between the inputs with the arrow keys', async () => {
    render(<StatefulTimePicker initialDate={afternoon} hourCycle={12} />);
    const [hours, minutes, seconds] = screen.getAllByRole('textbox');

    await userEvent.click(minutes);
    await userEvent.keyboard('{ArrowLeft}');
    expect(hours).toHaveFocus();

    await userEvent.click(minutes);
    await userEvent.keyboard('{ArrowRight}');
    expect(seconds).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('combobox')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(seconds).toHaveFocus();
  });

  it('shifts the hours when the period is switched', async () => {
    const onChange = vi.fn();
    render(
      <StatefulTimePicker
        initialDate={new Date(2024, 0, 15, 9, 30)}
        hourCycle={12}
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'PM' }));

    expect(lastDate(onChange)).toEqual(new Date(2024, 0, 15, 21, 30));
    expect(screen.getByRole('combobox')).toHaveTextContent('PM');
  });

  it('labels the hour input with a clock icon only', () => {
    render(<TimePicker date={afternoon} />);
    const [hours] = screen.getAllByRole('textbox');
    expect(hours).toHaveAttribute('id', 'datetime-picker-hour-input');
    expect(hours).toHaveAccessibleName('');
  });
});

describe('DateTimePicker', () => {
  const value = new Date(2024, 0, 15, 14, 30, 45);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 0, 10, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderPicker(
    props: Partial<React.ComponentProps<typeof DateTimePicker>> = {}
  ) {
    const onChange = vi.fn();
    const result = render(
      <DateTimePicker
        value={value}
        onChange={onChange}
        yearRange={1}
        {...props}
      />
    );
    return { ...result, onChange };
  }

  function getTrigger() {
    return document.querySelector(
      'button[aria-haspopup="dialog"]'
    ) as HTMLElement;
  }

  async function openPicker() {
    await userEvent.click(getTrigger());
    return screen.findByRole('dialog');
  }

  it('shows the placeholder without a value', () => {
    renderPicker({ value: undefined, placeholder: 'Pick a start date' });
    expect(getTrigger()).toHaveTextContent('Pick a start date');
    expect(getTrigger()).toHaveClass('text-muted-foreground');
  });

  it('formats the value with seconds in 24-hour time by default', () => {
    renderPicker();
    expect(getTrigger()).toHaveTextContent('January 15th, 2024 14:30:45');
    expect(getTrigger()).not.toHaveClass('text-muted-foreground');
  });

  it('formats the value in 12-hour time', () => {
    renderPicker({ hourCycle: 12 });
    expect(getTrigger()).toHaveTextContent('Jan 15, 2024 02:30:45 PM');
  });

  it.each([
    [24, 'January 15th, 2024 14:30'],
    [12, 'Jan 15, 2024 02:30 PM']
  ] as const)(
    'omits the seconds for minute granularity in %i-hour time',
    (hourCycle, text) => {
      renderPicker({ hourCycle, granularity: 'minute' });
      expect(getTrigger()).toHaveTextContent(text);
    }
  );

  it('uses a custom display format', () => {
    renderPicker({ displayFormat: { hour24: 'yyyy-MM-dd HH:mm' } });
    expect(getTrigger()).toHaveTextContent('2024-01-15 14:30');
  });

  it.fails('puts the id from its form control on the trigger', () => {
    const formControlProps = { id: 'start-date' };
    render(
      <>
        <label htmlFor="start-date">Start Date</label>
        <DateTimePicker value={value} {...formControlProps} />
      </>
    );
    expect(screen.getByLabelText('Start Date')).toBe(getTrigger());
  });

  it('cannot be opened when disabled', async () => {
    renderPicker({ disabled: true });
    expect(getTrigger()).toBeDisabled();
    await userEvent.click(getTrigger());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a calendar with month and year selectors and a time picker', async () => {
    renderPicker();
    await openPicker();
    expect(
      screen.getByRole('grid', { name: 'January 2024' })
    ).toBeInTheDocument();
    const [month, year] = screen.getAllByRole('combobox');
    expect(month).toHaveTextContent('January');
    expect(year).toHaveTextContent('2024');
    expect(getTimeValues()).toEqual(['14', '30', '45']);
  });

  it('hides the time picker for the day granularity', async () => {
    renderPicker({ granularity: 'day' });
    await openPicker();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the time when another day is picked', async () => {
    const { onChange } = renderPicker();
    await openPicker();

    await userEvent.click(screen.getByLabelText(/January 20th, 2024/));

    expect(onChange).toHaveBeenCalledWith(new Date(2024, 0, 20, 14, 30, 45));
    expect(getTrigger()).toHaveTextContent('January 20th, 2024 14:30:45');
  });

  it('updates the value from the time picker', async () => {
    const { onChange } = renderPicker();
    await openPicker();
    const [hours] = screen.getAllByRole('textbox');

    fireEvent.keyDown(hours, { key: 'ArrowUp' });

    expect(onChange).toHaveBeenCalledWith(new Date(2024, 0, 15, 15, 30, 45));
    expect(getTrigger()).toHaveTextContent('January 15th, 2024 15:30:45');
  });

  it('reports month navigation through onChange when no onMonthChange is given', async () => {
    const { onChange } = renderPicker({
      defaultPopupValue: new Date(2024, 0, 1)
    });
    await openPicker();

    await userEvent.click(screen.getByLabelText('Go to the Next Month'));

    expect(onChange).toHaveBeenCalledWith(new Date(2024, 1, 1, 14, 30, 45));
    expect(
      screen.getByRole('grid', { name: 'February 2024' })
    ).toBeInTheDocument();
  });

  it('keeps the month selector in sync after navigating', async () => {
    renderPicker({ defaultPopupValue: new Date(2024, 0, 1) });
    await openPicker();

    await userEvent.click(screen.getByLabelText('Go to the Next Month'));

    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('February');
  });

  it('jumps to the month picked in the month selector', async () => {
    const { onChange } = renderPicker({
      defaultPopupValue: new Date(2024, 0, 1)
    });
    await openPicker();

    await userEvent.click(screen.getAllByRole('combobox')[0]);
    await userEvent.click(await screen.findByRole('option', { name: 'March' }));

    expect(onChange).toHaveBeenCalledWith(new Date(2024, 2, 1, 14, 30, 45));
    expect(
      screen.getByRole('grid', { name: 'March 2024' })
    ).toBeInTheDocument();
  });

  it('reports month navigation through onMonthChange when provided', async () => {
    const onMonthChange = vi.fn();
    const { onChange } = renderPicker({
      defaultPopupValue: new Date(2024, 0, 1),
      onMonthChange
    });
    await openPicker();

    await userEvent.click(screen.getByLabelText('Go to the Previous Month'));

    expect(onMonthChange).toHaveBeenCalledWith(
      new Date(2023, 11, 1, 14, 30, 45)
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('only blocks pointer events on the previous button at the start of the year range', async () => {
    renderPicker({ yearRange: 0, value: new Date(2024, 0, 15, 14, 30, 45) });
    await openPicker();
    const previous = screen.getByLabelText('Go to the Previous Month');
    expect(previous).toHaveClass('pointer-events-none');
    expect(previous).toBeEnabled();
    expect(screen.getByLabelText('Go to the Next Month')).not.toHaveClass(
      'pointer-events-none'
    );
  });
});
