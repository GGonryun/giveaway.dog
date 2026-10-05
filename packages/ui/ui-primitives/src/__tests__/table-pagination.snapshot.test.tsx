import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TablePagination } from '../table-pagination';

type TablePaginationProps = React.ComponentProps<typeof TablePagination>;

function renderPagination(overrides: Partial<TablePaginationProps> = {}) {
  const onPageChange = vi.fn();
  const result = render(
    <TablePagination
      totalItems={45}
      currentPage={2}
      totalPages={5}
      pageSize={10}
      onPageChange={onPageChange}
      {...overrides}
    />
  );
  return { ...result, onPageChange };
}

describe('TablePagination', () => {
  it('matches the snapshot', () => {
    const { container } = renderPagination();
    expect(container.firstChild).toMatchSnapshot();
  });
});
