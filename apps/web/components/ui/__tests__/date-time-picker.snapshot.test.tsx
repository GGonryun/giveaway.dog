import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from '../date-time-picker';
import { withStableIds } from './test-utils';

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

  it('matches the snapshot of the trigger', () => {
    const { container } = renderPicker();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
