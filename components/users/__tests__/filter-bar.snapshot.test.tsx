import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
