import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function getButtons() {
  return {
    first: screen.getByRole('button', { name: 'First page' }),
    previous: screen.getByRole('button', { name: 'Previous page' }),
    next: screen.getByRole('button', { name: 'Next page' }),
    last: screen.getByRole('button', { name: 'Last page' })
  };
}

describe('TablePagination', () => {
  it('matches the snapshot', () => {
    const { container } = renderPagination();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('shows the range of items on the current page', () => {
    renderPagination();
    expect(screen.getByText('11-20 of 45')).toHaveTextContent(
      'Showing 11-20 of 45 items'
    );
  });

  it('clamps the last item to the total on the final page', () => {
    renderPagination({ currentPage: 5 });
    expect(screen.getByText('41-45 of 45')).toBeInTheDocument();
  });

  it('formats the total with thousands separators', () => {
    renderPagination({ totalItems: 12345, currentPage: 1, totalPages: 1235 });
    expect(screen.getByText('1-10 of 12,345')).toBeInTheDocument();
  });

  it('uses a custom item name', () => {
    renderPagination({ itemName: 'entries' });
    expect(screen.getByText('11-20 of 45')).toHaveTextContent(
      'Showing 11-20 of 45 entries'
    );
  });

  it('shows the current page and the page count', () => {
    const { container } = renderPagination();
    expect(container.querySelector('[data-slot="badge"]')).toHaveTextContent(
      '2'
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables the first and previous buttons on the first page', () => {
    renderPagination({ currentPage: 1 });
    const { first, previous, next, last } = getButtons();
    expect(first).toBeDisabled();
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(last).toBeEnabled();
  });

  it('disables the next and last buttons on the last page', () => {
    renderPagination({ currentPage: 5 });
    const { first, previous, next, last } = getButtons();
    expect(first).toBeEnabled();
    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();
    expect(last).toBeDisabled();
  });

  it('disables every button while a page change is pending', () => {
    renderPagination({ isPending: true });
    Object.values(getButtons()).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('requests the first, previous, next and last pages', async () => {
    const { onPageChange } = renderPagination({ currentPage: 3 });
    const { first, previous, next, last } = getButtons();
    await userEvent.click(first);
    await userEvent.click(previous);
    await userEvent.click(next);
    await userEvent.click(last);
    expect(onPageChange.mock.calls).toEqual([[1], [2], [4], [5]]);
  });

  it('reports an inverted range when there are no items', () => {
    renderPagination({ totalItems: 0, currentPage: 1, totalPages: 0 });
    expect(screen.getByText('1-0 of 0')).toBeInTheDocument();
  });

  it('lets the user request page zero when there are no pages', async () => {
    const { onPageChange } = renderPagination({
      totalItems: 0,
      currentPage: 1,
      totalPages: 0
    });
    const { next, last } = getButtons();
    expect(next).toBeEnabled();
    await userEvent.click(next);
    await userEvent.click(last);
    expect(onPageChange.mock.calls).toEqual([[0], [0]]);
  });
});
