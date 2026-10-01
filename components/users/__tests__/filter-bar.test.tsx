import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../filter-bar';

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type Filters = React.ComponentProps<typeof FilterBar>['filters'];

const DEFAULT_FILTERS: Filters = {
  query: 'ada',
  minScore: 0,
  maxScore: 100,
  status: 'all',
  dateRange: 'all'
};

const renderBar = (filters: Filters = DEFAULT_FILTERS) => {
  const onChange = vi.fn();
  const view = render(<FilterBar filters={filters} onChange={onChange} />);
  return { ...view, onChange };
};

const triggerButton = () => screen.getByRole('button', { name: /^Filters/ });

const statusSelect = () => screen.getAllByRole('combobox')[0];
const dateRangeSelect = () => screen.getAllByRole('combobox')[1];

const selectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  select: HTMLElement,
  option: string
) => {
  await user.click(select);
  await user.click(screen.getByRole('option', { name: option }));
};

describe('FilterBar', () => {
  describe('snapshots', () => {
    it('matches the snapshot without active filters', () => {
      const { container } = renderBar();

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot with active filters', () => {
      const { container } = renderBar({
        ...DEFAULT_FILTERS,
        status: 'blocked'
      });

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('active filter count', () => {
    it('shows no count without active filters', () => {
      renderBar();

      expect(triggerButton()).toHaveTextContent(/^Filters$/);
    });

    it.each([
      ['a raised minimum score', { minScore: 10 }, '1'],
      ['a lowered maximum score', { maxScore: 90 }, '1'],
      ['a narrowed score range', { minScore: 10, maxScore: 90 }, '1'],
      ['a status', { status: 'active' }, '1'],
      ['a date range', { dateRange: '7d' }, '1'],
      [
        'every filter',
        { minScore: 10, status: 'blocked', dateRange: '30d' },
        '3'
      ]
    ])('counts %s', (_label, overrides, count) => {
      renderBar({ ...DEFAULT_FILTERS, ...overrides });

      expect(triggerButton()).toHaveTextContent(`Filters${count}`);
    });

    it('does not count the search query', () => {
      renderBar({ ...DEFAULT_FILTERS, query: 'grace' });

      expect(triggerButton()).toHaveTextContent(/^Filters$/);
    });
  });

  describe('when opened', () => {
    it('shows the current score range', async () => {
      const user = userEvent.setup();
      renderBar({ ...DEFAULT_FILTERS, minScore: 20, maxScore: 80 });

      await user.click(triggerButton());

      expect(screen.getByText('Quality Score: 20 - 80')).toBeInTheDocument();
      expect(
        screen
          .getAllByRole('slider')
          .map((slider) => slider.getAttribute('aria-valuenow'))
      ).toEqual(['20', '80']);
    });

    it('shows the current status and date range', async () => {
      const user = userEvent.setup();
      renderBar({ ...DEFAULT_FILTERS, status: 'active', dateRange: '90d' });

      await user.click(triggerButton());

      expect(statusSelect()).toHaveTextContent('Active');
      expect(dateRangeSelect()).toHaveTextContent('Last 90 days');
    });
  });

  describe('when a status or date range is chosen', () => {
    it('reports the new status immediately', async () => {
      const user = userEvent.setup();
      const { onChange } = renderBar();

      await user.click(triggerButton());
      await selectOption(user, statusSelect(), 'Blocked');

      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        status: 'blocked'
      });
    });

    it('reports the new date range immediately', async () => {
      const user = userEvent.setup();
      const { onChange } = renderBar();

      await user.click(triggerButton());
      await selectOption(user, dateRangeSelect(), 'Last 30 days');

      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        dateRange: '30d'
      });
    });
  });

  describe('when the filters are reset', () => {
    it('reports the default filters and clears the query', async () => {
      const user = userEvent.setup();
      const { onChange } = renderBar({
        query: 'ada',
        minScore: 30,
        maxScore: 70,
        status: 'blocked',
        dateRange: '1y'
      });

      await user.click(triggerButton());
      await user.click(screen.getByRole('button', { name: /^Reset/ }));

      expect(onChange).toHaveBeenCalledWith({
        query: '',
        minScore: 0,
        maxScore: 100,
        status: 'all',
        dateRange: 'all'
      });
    });
  });

  describe('when the score range changes', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const openAndGetSliders = () => {
      fireEvent.click(triggerButton());
      return screen.getAllByRole('slider');
    };

    it('updates the score label immediately', () => {
      const { onChange } = renderBar();
      const [minimum] = openAndGetSliders();

      fireEvent.keyDown(minimum, { key: 'ArrowRight' });

      expect(screen.getByText('Quality Score: 5 - 100')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('reports the new minimum after 500ms', () => {
      const { onChange } = renderBar();
      const [minimum] = openAndGetSliders();

      fireEvent.keyDown(minimum, { key: 'ArrowRight' });
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        minScore: 5
      });
    });

    it('reports the new maximum after 500ms', () => {
      const { onChange } = renderBar();
      const [, maximum] = openAndGetSliders();

      fireEvent.keyDown(maximum, { key: 'ArrowLeft' });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        maxScore: 95
      });
    });

    it('reports only the final value of rapid changes', () => {
      const { onChange } = renderBar();
      const [minimum] = openAndGetSliders();

      fireEvent.keyDown(minimum, { key: 'ArrowRight' });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.keyDown(minimum, { key: 'ArrowRight' });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        minScore: 10
      });
    });

    it('drops a pending change when unmounted', () => {
      const { onChange, unmount } = renderBar();
      const [minimum] = openAndGetSliders();

      fireEvent.keyDown(minimum, { key: 'ArrowRight' });
      unmount();
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('when the filters change from outside', () => {
    it('shows the new score range', async () => {
      const user = userEvent.setup();
      const { rerender } = renderBar();

      rerender(
        <FilterBar
          filters={{ ...DEFAULT_FILTERS, minScore: 40, maxScore: 60 }}
          onChange={vi.fn()}
        />
      );
      await user.click(triggerButton());

      expect(screen.getByText('Quality Score: 40 - 60')).toBeInTheDocument();
    });
  });
});
