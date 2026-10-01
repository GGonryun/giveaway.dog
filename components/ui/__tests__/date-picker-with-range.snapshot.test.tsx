import { render } from '@testing-library/react';
import type { DateRange } from 'react-day-picker';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePickerWithRange } from '../date-picker-with-range';
import { withStableIds } from './test-utils';

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

describe('DatePickerWithRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot without a date', () => {
    const { container } = renderPicker(undefined);
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
